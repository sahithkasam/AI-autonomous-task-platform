import { BaseAgent } from './BaseAgent.js';
import { MEMORY_PROMPT } from '../prompts/agentPrompts.js';
import Task from '../models/Task.js';
export class MemoryAgent extends BaseAgent {
  constructor(taskId, userId) { super('memory', taskId, userId); }
  async buildContext(currentTask) {
    await this.emit('agent:started', { message: 'Memory Agent loading context...' });
    const recentTasks = await Task.find({ userId: this.userId, status: 'completed' }).sort({ completedAt: -1 }).limit(5).select('title description category').lean();
    const taskHistory = recentTasks.map(t => `[${t.category}] ${t.title}: ${t.description.slice(0, 150)}`).join('\n');
    const result = await this.generate(MEMORY_PROMPT(this.userId, taskHistory, currentTask));
    const memoryData = this.parseJSON(result.text);
    await this.emit('agent:completed', { message: `Context loaded (${recentTasks.length} past tasks)` });
    return { context: memoryData?.personalizedContext || '', userPatterns: memoryData?.userPatterns || [], insights: memoryData?.memoryInsights || [], tokensUsed: result.tokensUsed };
  }
}
