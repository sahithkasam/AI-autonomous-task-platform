import { BaseAgent } from './BaseAgent.js';
import { OPTIMIZER_PROMPT } from '../prompts/agentPrompts.js';
export class OptimizerAgent extends BaseAgent {
  constructor(taskId, userId) { super('optimizer', taskId, userId); }
  async optimize(subtask, previousOutputs, constraints = '', onChunk = null) {
    await this.emit('agent:started', { message: 'Optimizer Agent enhancing outputs...' });
    const prev = Array.isArray(previousOutputs) ? previousOutputs.map((o, i) => `--- Output ${i+1} ---\n${o}`).join('\n\n') : previousOutputs;
    const result = onChunk ? await this.generateStream(OPTIMIZER_PROMPT(subtask, prev, constraints), onChunk) : await this.generate(OPTIMIZER_PROMPT(subtask, prev, constraints));
    await this.emit('agent:completed', { message: 'Optimization complete' });
    return { output: result.text, tokensUsed: result.tokensUsed, confidence: 0.82 };
  }
}
