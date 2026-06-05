import { useEffect, useRef } from 'react';
import { getSocket, joinTaskRoom, leaveTaskRoom } from '../utils/socket';
import { useTaskStore } from '../store/taskStore';

export const useTaskSocket = (taskId) => {
  const { addAgentEvent, appendStream, finalizeStream, updateSubtask } = useTaskStore();
  const handlersRef = useRef({});

  useEffect(() => {
    if (!taskId) return;
    const socket = getSocket();
    if (!socket) return;

    // Join task-specific room
    joinTaskRoom(taskId);

    const handlers = {
      'agent:started':       (d) => addAgentEvent({ type: 'started', ...d }),
      'agent:thinking':      (d) => addAgentEvent({ type: 'thinking', ...d }),
      'agent:completed':     (d) => addAgentEvent({ type: 'completed', ...d }),
      'agent:error':         (d) => addAgentEvent({ type: 'error', ...d }),
      'agent:retrying':      (d) => addAgentEvent({ type: 'retrying', ...d }),
      'agent:streaming_start': (d) => addAgentEvent({ type: 'thinking', ...d }),
      'agent:streaming_end': ()  => finalizeStream(),
      'agent:stream_chunk':  ({ chunk }) => appendStream(chunk),
      'task:status_update':  (d) => { if (!taskId || d.taskId === taskId) addAgentEvent({ type: 'status', ...d }); },
      'task:plan_ready':     (d) => { if (!taskId || d.taskId === taskId) addAgentEvent({ type: 'plan', ...d }); },
      'task:completed':      (d) => {
        if (!taskId || d.taskId === taskId) {
          addAgentEvent({ type: 'done', ...d });
          if (d.finalOutput) finalizeStream(d.finalOutput);
        }
      },
      'task:failed':         (d) => { if (!taskId || d.taskId === taskId) addAgentEvent({ type: 'error', ...d }); },
      'subtask:update':      (d) => { updateSubtask(d.subtaskId, d); addAgentEvent({ type: 'subtask', ...d }); },
      'orchestrator:started':(d) => addAgentEvent({ type: 'orchestrator', ...d }),
      'task:joined':         (d) => addAgentEvent({ type: 'status', message: 'Connected to agent stream ✓', agentType: 'orchestrator' }),
    };

    handlersRef.current = handlers;
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      leaveTaskRoom(taskId);
      Object.keys(handlersRef.current).forEach((event) => socket.off(event, handlersRef.current[event]));
    };
  }, [taskId]);
};
