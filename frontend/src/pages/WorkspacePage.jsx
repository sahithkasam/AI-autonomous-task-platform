import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, Clock, TrendingUp, RefreshCw, ChevronLeft, AlertCircle, CheckCircle, Loader, Download, Plus } from 'lucide-react';
import { taskAPI } from '../utils/api';
import { useTaskStore } from '../store/taskStore';
import { useTaskSocket } from '../hooks/useTaskSocket';
import TaskCreator from '../components/chat/TaskCreator';
import StreamingOutput from '../components/chat/StreamingOutput';
import AgentEventFeed from '../components/agents/AgentEventFeed';
import AgentStatusCard from '../components/agents/AgentStatusCard';
import WorkflowGraph from '../components/workflow/WorkflowGraph';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AGENT_TYPES = ['planner', 'memory', 'research', 'optimizer', 'critic', 'final'];

export default function WorkspacePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('output');
  const { activeTask, setActiveTask, agentEvents, streamBuffer, isStreaming, clearTask } = useTaskStore();
  useTaskSocket(taskId || activeTask?._id);

  const { data: taskData } = useQuery({
    queryKey: ['task', taskId], enabled: !!taskId,
    queryFn: () => taskAPI.getById(taskId).then(r => r.data.task),
    refetchInterval: (d) => (d && ['queued','planning','executing','reviewing'].includes(d?.status)) ? 3000 : false,
  });

  const { data: logsData } = useQuery({
    queryKey: ['task-logs', taskId], enabled: !!taskId && activeTab === 'logs',
    queryFn: () => taskAPI.getLogs(taskId).then(r => r.data.logs),
  });

  useEffect(() => { if (taskData) setActiveTask(taskData); }, [taskData]);

  const createMutation = useMutation({
    mutationFn: (data) => taskAPI.create(data).then(r => r.data.task),
    onSuccess: (task) => {
      setActiveTask(task);
      navigate(`/workspace/${task._id}`, { replace: true });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task started! Agents collaborating (may take 3-5 mins)...');
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => taskAPI.retry(activeTask._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', activeTask._id] }); toast.success('Task restarted'); },
  });

  const currentTask = activeTask || taskData;
  const isRunning = currentTask && ['queued','planning','executing','reviewing'].includes(currentTask?.status);
  const outputContent = streamBuffer || currentTask?.finalOutput || '';

  const getAgentStatus = (type) => {
    const s = currentTask?.subtasks?.find(s => s.assignedAgent === type);
    if (s) return s.status;
    const ev = [...agentEvents].reverse().find(e => e.agentType === type);
    if (!ev) return 'pending';
    if (ev.type === 'completed') return 'completed';
    if (ev.type === 'started' || ev.type === 'thinking') return 'in_progress';
    if (ev.type === 'error') return 'failed';
    return 'pending';
  };

  const handleExport = () => {
    if (!outputContent) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([outputContent], { type: 'text/markdown' }));
    a.download = `${currentTask?.title || 'task'}.md`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-80 xl:w-96 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-surface-800/50 overflow-y-auto">
        <div className="p-4 border-b border-white/10">
          {taskId && <button onClick={() => { navigate('/workspace'); clearTask(); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition-colors"><ChevronLeft size={16} />New Task</button>}
          {!taskId ? <TaskCreator onSubmit={createMutation.mutate} isLoading={createMutation.isPending} /> : (
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">{currentTask?.title}</h3>
              <p className="text-xs text-gray-500 capitalize">{currentTask?.category} · {currentTask?.priority}</p>
              {currentTask?.status === 'failed' && <button onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending} className="btn-secondary mt-3 text-xs py-1.5"><RefreshCw size={12}/>Retry</button>}
            </div>
          )}
        </div>
        {currentTask && <>
          <div className="p-4 border-b border-white/10">
            <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium', currentTask.status==='completed'?'bg-green-500/10 text-green-400':currentTask.status==='failed'?'bg-red-500/10 text-red-400':isRunning?'bg-brand-500/10 text-brand-400':'bg-gray-500/10 text-gray-400')}>
              {isRunning && <Loader size={14} className="animate-spin"/>}
              {currentTask.status==='completed' && <CheckCircle size={14}/>}
              {currentTask.status==='failed' && <AlertCircle size={14}/>}
              <span className="capitalize">{currentTask.status}</span>
              {currentTask.executionStats?.totalTokens > 0 && <span className="ml-auto text-xs opacity-70">{currentTask.executionStats.totalTokens.toLocaleString()} tokens</span>}
            </div>
            {currentTask.status==='completed' && currentTask.executionStats && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[{icon:Clock,label:'Time',value:`${Math.round((currentTask.executionStats.executionTimeMs||0)/1000)}s`},{icon:TrendingUp,label:'Score',value:`${Math.round((currentTask.executionStats.confidenceScore||0)*100)}%`}].map(({icon:Icon,label,value}) => (
                  <div key={label} className="glass rounded-lg p-2 text-center"><Icon size={12} className="text-gray-500 mx-auto mb-1"/><p className="text-white text-sm font-semibold">{value}</p><p className="text-gray-600 text-xs">{label}</p></div>
                ))}
              </div>
            )}
          </div>
          {isRunning && <div className="px-4 py-3 border-b border-white/10"><div className="flex items-center gap-2 text-xs text-yellow-400"><Clock size={12}/><span>Rate-limited: ~13s between agent calls</span></div></div>}
          <div className="p-4 flex-1">
            <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Agents</h4>
            <div className="space-y-2">
              {AGENT_TYPES.map(type => { const status = getAgentStatus(type); const ev = [...agentEvents].reverse().find(e => e.agentType === type); return (
                <AgentStatusCard key={type} agentType={type} status={status} message={ev?.message || ev?.data?.message} confidence={currentTask.subtasks?.find(s => s.assignedAgent === type)?.confidence || 0} />
              ); })}
            </div>
          </div>
        </>}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {!currentTask && !taskId ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float"><Brain size={36} className="text-white"/></div>
              <h2 className="text-2xl font-bold text-white mb-3">Agent Workspace</h2>
              <p className="text-gray-400 leading-relaxed">Describe your goal on the left. 6 specialized AI agents will collaborate to deliver a comprehensive solution.</p>
              <div className="mt-4 text-xs text-yellow-400/70 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">Using Groq LLaMA 3.3 70B · ~30 seconds per task</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1 px-6 pt-4 border-b border-white/10">
              {['output','workflow','events','logs'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={clsx('px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize border-b-2 -mb-px', activeTab===tab?'text-brand-400 border-brand-400 bg-brand-500/5':'text-gray-500 border-transparent hover:text-gray-300')}>{tab}</button>
              ))}
              {currentTask?.status==='completed' && outputContent && (
                <div className="ml-auto flex gap-2 pb-2"><button onClick={handleExport} className="btn-ghost py-1 px-2 text-xs"><Download size={14}/>Export MD</button></div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab==='output' && <motion.div key="output" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <StreamingOutput content={outputContent} isStreaming={isStreaming} title={currentTask?.title||'Task Output'} />
                  {!outputContent && !isStreaming && isRunning && <div className="flex items-center justify-center py-20"><div className="text-center"><div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4"/><p className="text-gray-400">Agents collaborating...</p><p className="text-sm text-gray-600 mt-1">Check Events tab for live updates</p></div></div>}
                </motion.div>}
                {activeTab==='workflow' && <motion.div key="workflow" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <WorkflowGraph subtasks={currentTask?.subtasks||[]} />
                  {currentTask?.subtasks?.length > 0 && <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Subtasks</h3>
                    {currentTask.subtasks.map(s => (
                      <div key={s.id} className="glass rounded-xl p-4 flex items-start gap-3">
                        <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', s.status==='completed'?'bg-green-400':s.status==='in_progress'?'bg-brand-400 animate-pulse':s.status==='failed'?'bg-red-400':'bg-gray-600')} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-medium text-white">{s.title}</span><span className="badge bg-white/5 text-gray-400 text-xs capitalize">{s.assignedAgent}</span></div>
                          <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>}
                </motion.div>}
                {activeTab==='events' && <motion.div key="events" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <div className="glass rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2"><Activity size={14}/>Live Agent Feed{isRunning && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>}</h3>
                    <AgentEventFeed events={agentEvents}/>
                  </div>
                </motion.div>}
                {activeTab==='logs' && <motion.div key="logs" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  <div className="glass rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/60"/><div className="w-3 h-3 rounded-full bg-yellow-500/60"/><div className="w-3 h-3 rounded-full bg-green-500/60"/></div><span className="text-xs text-gray-500 font-mono">agent_logs</span></div>
                    <div className="p-4 font-mono text-xs space-y-2 max-h-[60vh] overflow-y-auto">
                      {logsData?.length ? logsData.map((log, i) => (
                        <div key={i} className="flex gap-3 text-gray-400">
                          <span className="text-gray-600 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={clsx('flex-shrink-0 capitalize', log.agentType==='planner'?'text-violet-400':log.agentType==='research'?'text-blue-400':log.agentType==='optimizer'?'text-yellow-400':log.agentType==='critic'?'text-red-400':log.agentType==='final'?'text-orange-400':'text-green-400')}>[{log.agentType}]</span>
                          <span className={clsx(log.status==='failed'?'text-red-400':log.status==='completed'?'text-green-400':'text-gray-300')}>{log.action} — {log.status}</span>
                          {log.tokensUsed > 0 && <span className="text-gray-600 ml-auto">{log.tokensUsed}tok</span>}
                        </div>
                      )) : <p className="text-gray-600">Switch to Logs tab after task completes.</p>}
                    </div>
                  </div>
                </motion.div>}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
