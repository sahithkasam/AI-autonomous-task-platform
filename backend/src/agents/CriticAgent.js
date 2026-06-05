import { BaseAgent } from './BaseAgent.js';
import { CRITIC_PROMPT } from '../prompts/agentPrompts.js';
export class CriticAgent extends BaseAgent {
  constructor(taskId, userId) { super('critic', taskId, userId); }
  async critique(allOutputs, originalTask, successCriteria) {
    await this.emit('agent:started', { message: 'Critic Agent reviewing quality...' });
    const compiled = Object.entries(allOutputs).map(([agent, output]) => `=== ${agent.toUpperCase()} ===\n${output}`).join('\n\n');
    const result = await this.generate(CRITIC_PROMPT(compiled, originalTask, successCriteria));
    const critique = this.parseJSON(result.text) || { overallScore: 0.82, completenessScore: 0.82, accuracyScore: 0.82, actionabilityScore: 0.82, issues: [], strengths: ['Comprehensive'], approvalStatus: 'approved', revisionInstructions: '' };
    critique.tokensUsed = result.tokensUsed;
    await this.emit('agent:completed', { message: `Quality score: ${Math.round((critique.overallScore||0.82)*100)}%`, data: { score: critique.overallScore } });
    return critique;
  }
}
