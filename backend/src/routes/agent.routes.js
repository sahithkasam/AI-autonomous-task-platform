import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import AgentLog from '../models/AgentLog.js';
const router = Router();
router.use(authenticate);
router.get('/logs', async (req, res) => {
  const { taskId, agentType, limit = 50 } = req.query;
  const filter = { userId: req.user._id };
  if (taskId) filter.taskId = taskId;
  if (agentType) filter.agentType = agentType;
  const logs = await AgentLog.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit)).lean();
  res.json({ success: true, logs });
});
router.get('/types', (req, res) => {
  res.json({ success: true, agents: [
    { id: 'planner', name: 'Planner', description: 'Breaks tasks into subtasks', color: 'violet' },
    { id: 'research', name: 'Research', description: 'Gathers and analyzes information', color: 'blue' },
    { id: 'optimizer', name: 'Optimizer', description: 'Refines and enhances outputs', color: 'yellow' },
    { id: 'memory', name: 'Memory', description: 'Maintains context and preferences', color: 'green' },
    { id: 'critic', name: 'Critic', description: 'Reviews quality and completeness', color: 'red' },
    { id: 'final', name: 'Final', description: 'Synthesizes polished response', color: 'orange' },
  ]});
});
export default router;
