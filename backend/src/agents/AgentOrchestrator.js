import { PlannerAgent } from './PlannerAgent.js';
import { ResearchAgent } from './ResearchAgent.js';
import { OptimizerAgent } from './OptimizerAgent.js';
import { MemoryAgent } from './MemoryAgent.js';
import { CriticAgent } from './CriticAgent.js';
import { FinalAgent } from './FinalAgent.js';
import Task from '../models/Task.js';
import { getSocketIO } from '../socket/socketManager.js';
import { logger } from '../utils/logger.js';
import { retrieveRelevantChunks, formatContextForPrompt } from '../services/ragService.js';

export class AgentOrchestrator {
  constructor(taskId, userId) {
    this.taskId = taskId;
    this.userId = userId;
    this.agents = {
      planner: new PlannerAgent(taskId, userId),
      research: new ResearchAgent(taskId, userId),
      optimizer: new OptimizerAgent(taskId, userId),
      memory: new MemoryAgent(taskId, userId),
      critic: new CriticAgent(taskId, userId),
      final: new FinalAgent(taskId, userId),
    };
    this.totalTokens = 0;
    this.startTime = Date.now();
    // Groq free tier: 30 RPM → safe delay of 3s between calls
    this.agentCallDelay = 3000;
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async emit(event, data) {
    try {
      const io = getSocketIO();
      // Emit to both task room AND user room to ensure delivery
      io.to(`task:${this.taskId}`).emit(event, data);
      io.to(`user:${this.userId}`).emit(event, { taskId: this.taskId, ...data });
    } catch {}
  }

  async updateTaskStatus(status, extra = {}) {
    await Task.findByIdAndUpdate(this.taskId, { status, ...extra });
    await this.emit('task:status_update', { status, taskId: this.taskId, ...extra });
  }

  async updateSubtaskStatus(subtaskId, status, output = '', tokensUsed = 0, confidence = 0) {
    await Task.findOneAndUpdate(
      { _id: this.taskId, 'subtasks.id': subtaskId },
      {
        $set: {
          'subtasks.$.status': status,
          'subtasks.$.output': output,
          'subtasks.$.tokensUsed': tokensUsed,
          'subtasks.$.confidence': confidence,
          ...(status === 'in_progress' ? { 'subtasks.$.startedAt': new Date() } : {}),
          ...(status === 'completed' ? { 'subtasks.$.completedAt': new Date() } : {}),
        }
      }
    );
    await this.emit('subtask:update', { subtaskId, status, taskId: this.taskId });
  }

  async execute(taskDescription, agentConfig = {}, onStreamChunk = null, attachedDocuments = []) {
    const executionStart = Date.now();
    try {
      await this.updateTaskStatus('planning', { startedAt: new Date() });
      await this.emit('orchestrator:started', { message: '🚀 Multi-agent workflow started! Groq LLaMA 3.3 70B ready.' });

      // 1: Memory Agent
      await this.emit('agent:started', { agentType: 'memory', message: 'Memory Agent loading your context...' });
      const memoryResult = await this.agents.memory.buildContext(taskDescription);
      this.totalTokens += memoryResult.tokensUsed || 0;
      await this.sleep(this.agentCallDelay);

      // 2: Planner Agent
      const plan = await this.agents.planner.plan(taskDescription, memoryResult.context);
      this.totalTokens += plan.tokensUsed || 0;

      const subtasksForDB = plan.subtasks.map(s => ({
        id: s.id, title: s.title, description: s.description,
        assignedAgent: s.assignedAgent, status: 'pending', tokensUsed: 0, confidence: 0,
      }));

      await Task.findByIdAndUpdate(this.taskId, {
        status: 'executing',
        subtasks: subtasksForDB,
        category: plan.category,
        'agentConfig.executionMode': plan.executionMode,
      });

      await this.emit('task:plan_ready', { plan, subtasks: subtasksForDB, taskId: this.taskId });

      // 3: Execute subtasks sequentially
      const agentOutputs = {};
      const enabledAgents = agentConfig.enabledAgents || ['research', 'optimizer', 'critic', 'final'];
      let first = true;

      for (const subtask of plan.subtasks) {
        if (!enabledAgents.includes(subtask.assignedAgent)) continue;
        if (!first) await this.sleep(this.agentCallDelay);
        first = false;

        await this.updateSubtaskStatus(subtask.id, 'in_progress');
        await this.emit('subtask:started', { subtask, taskId: this.taskId });

        try {
          let result;
          const agent = subtask.assignedAgent;

          if (agent === 'research') {
            let documentContext = '';
            if (attachedDocuments?.length) {
              try {
                const relevantChunks = await retrieveRelevantChunks({
                  userId: this.userId,
                  query: `${subtask.title} ${subtask.description}`,
                  documentIds: attachedDocuments,
                  topK: 6,
                });
                documentContext = formatContextForPrompt(relevantChunks);
              } catch (err) {
                logger.warn(`RAG retrieval failed for subtask ${subtask.id}: ${err.message}`);
              }
            }
            result = await this.agents.research.research(subtask.description, taskDescription, documentContext, onStreamChunk);
          } else if (agent === 'optimizer') {
            result = await this.agents.optimizer.optimize(subtask.description, Object.values(agentOutputs), plan.constraints?.join(', ') || '', onStreamChunk);
          } else if (agent === 'critic') {
            result = await this.agents.critic.critique(agentOutputs, taskDescription, plan.successCriteria);
          } else if (agent === 'memory') {
            result = { output: memoryResult.context, tokensUsed: 0, confidence: 0.8 };
          }

          if (result) {
            agentOutputs[agent] = result.output || JSON.stringify(result);
            this.totalTokens += result.tokensUsed || 0;
            await this.updateSubtaskStatus(subtask.id, 'completed', result.output, result.tokensUsed, result.confidence || 0.8);
          }
        } catch (err) {
          logger.error(`Subtask ${subtask.id} failed: ${err.message}`);
          await this.updateSubtaskStatus(subtask.id, 'failed', err.message);
        }
      }

      // 4: Critic review
      await this.updateTaskStatus('reviewing');
      await this.sleep(this.agentCallDelay);
      let criticResult;
      if (!agentOutputs.critic) {
        criticResult = await this.agents.critic.critique(agentOutputs, taskDescription, plan.successCriteria);
        this.totalTokens += criticResult.tokensUsed || 0;
        agentOutputs.critic = JSON.stringify(criticResult);
      } else {
        criticResult = { overallScore: 0.85, revisionInstructions: '' };
      }

      // 5: Final synthesis
      await this.sleep(this.agentCallDelay);
      const finalResult = await this.agents.final.synthesize(
        taskDescription, agentOutputs, criticResult, memoryResult.context, onStreamChunk
      );
      this.totalTokens += finalResult.tokensUsed || 0;

      const executionTimeMs = Date.now() - executionStart;
      const confidenceScore = criticResult.overallScore || 0.85;

      await Task.findByIdAndUpdate(this.taskId, {
        status: 'completed',
        finalOutput: finalResult.output,
        completedAt: new Date(),
        'executionStats.totalTokens': this.totalTokens,
        'executionStats.totalCost': parseFloat(((this.totalTokens / 1_000_000) * 0.59).toFixed(6)),
        'executionStats.executionTimeMs': executionTimeMs,
        'executionStats.agentRounds': plan.subtasks.length,
        'executionStats.confidenceScore': confidenceScore,
      });

      await this.emit('task:completed', {
        taskId: this.taskId,
        finalOutput: finalResult.output,
        stats: { totalTokens: this.totalTokens, executionTimeMs, confidenceScore, agentRounds: plan.subtasks.length },
      });

      logger.info(`Task ${this.taskId} completed in ${Math.round(executionTimeMs/1000)}s, ${this.totalTokens} tokens`);
      return { success: true, output: finalResult.output };

    } catch (err) {
      logger.error(`Orchestrator error for task ${this.taskId}: ${err.message}`);
      await this.updateTaskStatus('failed', { error: err.message });
      await this.emit('task:failed', { taskId: this.taskId, error: err.message });
      throw err;
    }
  }
}
