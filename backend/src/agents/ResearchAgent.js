import { BaseAgent } from './BaseAgent.js';
import { RESEARCH_PROMPT } from '../prompts/agentPrompts.js';
export class ResearchAgent extends BaseAgent {
  constructor(taskId, userId) { super('research', taskId, userId); }
  async research(subtask, taskContext, documents = '', onChunk = null) {
    await this.emit('agent:started', { message: `Research Agent: ${subtask.slice(0,60)}...` });
    const prompt = RESEARCH_PROMPT(subtask, taskContext, documents);
    const result = onChunk ? await this.generateStream(prompt, onChunk) : await this.generate(prompt);
    const confidence = Math.min(0.95, 0.6 + (result.text.split(' ').length > 300 ? 0.2 : 0.1) + (/#{1,3}|\d+%/m.test(result.text) ? 0.1 : 0));
    await this.emit('agent:completed', { message: 'Research complete', data: { confidence } });
    return { output: result.text, tokensUsed: result.tokensUsed, confidence };
  }
}
