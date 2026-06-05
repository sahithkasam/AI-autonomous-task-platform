import { create } from 'zustand';
export const useTaskStore = create((set, get) => ({
  activeTask: null, agentEvents: [], streamBuffer: '', isStreaming: false, subtaskUpdates: {},
  setActiveTask: (task) => set({ activeTask: task, agentEvents: [], streamBuffer: '', subtaskUpdates: {} }),
  addAgentEvent: (event) => set((s) => ({ agentEvents: [...s.agentEvents.slice(-100), { ...event, id: Date.now(), timestamp: new Date() }] })),
  appendStream: (chunk) => set((s) => ({ streamBuffer: s.streamBuffer + chunk, isStreaming: true })),
  finalizeStream: (fullText) => set({ streamBuffer: fullText || get().streamBuffer, isStreaming: false }),
  resetStream: () => set({ streamBuffer: '', isStreaming: false }),
  updateSubtask: (id, update) => set((s) => ({ subtaskUpdates: { ...s.subtaskUpdates, [id]: update } })),
  clearTask: () => set({ activeTask: null, agentEvents: [], streamBuffer: '', isStreaming: false, subtaskUpdates: {} }),
}));
