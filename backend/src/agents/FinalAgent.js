import { BaseAgent } from './BaseAgent.js';
import { FINAL_RESPONSE_PROMPT } from '../prompts/agentPrompts.js';
export class FinalAgent extends BaseAgent {
  constructor(taskId, userId) { super('final', taskId, userId); }
  async synthesize(originalTask, allOutputs, criticFeedback, userContext = '', onChunk = null) {
    await this.emit('agent:started', { message: 'Final Agent synthesizing comprehensive response...' });
    const compiled = Object.entries(allOutputs).map(([agent, output]) => `=== ${agent.toUpperCase()} ===\n${output}`).join('\n\n');
    const criticSummary = typeof criticFeedback === 'object' ? `Score: ${Math.round((criticFeedback.overallScore||0.8)*100)}%. ${criticFeedback.revisionInstructions||''}` : criticFeedback;
    const result = onChunk ? await this.generateStream(FINAL_RESPONSE_PROMPT(originalTask, compiled, criticSummary, userContext), onChunk) : await this.generate(FINAL_RESPONSE_PROMPT(originalTask, compiled, criticSummary, userContext));
    await this.emit('agent:completed', { message: 'Final response ready!', data: { wordCount: result.text.split(' ').length } });
    return { output: result.text, tokensUsed: result.tokensUsed };
  }
}
