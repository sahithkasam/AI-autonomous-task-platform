import { BaseAgent } from './BaseAgent.js';
import { PLANNER_PROMPT } from '../prompts/agentPrompts.js';
import { v4 as uuidv4 } from 'uuid';
export class PlannerAgent extends BaseAgent {
  constructor(taskId, userId) { super('planner', taskId, userId); }
  async plan(taskDescription, userContext = '') {
    await this.emit('agent:started', { message: 'Planner Agent analyzing your task...' });
    const result = await this.generate(PLANNER_PROMPT(taskDescription, userContext));
    let plan = this.parseJSON(result.text);
    if (!plan) plan = { taskUnderstanding: taskDescription, category: 'other', complexity: 'medium', estimatedDuration: '5-10 minutes', executionMode: 'sequential', subtasks: [{ id: uuidv4(), title: 'Research', description: 'Research relevant information', assignedAgent: 'research', dependencies: [], priority: 1 }, { id: uuidv4(), title: 'Synthesize', description: 'Create final response', assignedAgent: 'final', dependencies: [], priority: 2 }], constraints: [], successCriteria: 'Comprehensive response' };
    plan.subtasks = (plan.subtasks || []).map(s => ({ ...s, id: s.id || uuidv4() }));
    plan.tokensUsed = result.tokensUsed;
    await this.emit('agent:completed', { message: `Plan created: ${plan.subtasks.length} subtasks`, data: { subtaskCount: plan.subtasks.length, category: plan.category } });
    return plan;
  }
}
