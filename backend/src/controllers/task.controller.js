import Task from '../models/Task.js';
import AgentLog from '../models/AgentLog.js';
import User from '../models/User.js';
import { AgentOrchestrator } from '../agents/AgentOrchestrator.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { getSocketIO } from '../socket/socketManager.js';

export const createTask = async (req, res) => {
  const { title, description, priority, agentConfig, attachedDocuments } = req.body;
  if (!title || !description) throw new AppError('Title and description are required', 400);

  const task = await Task.create({
    userId: req.user._id,
    title,
    description,
    priority: priority || 'medium',
    agentConfig: {
      enabledAgents: agentConfig?.enabledAgents || ['research', 'optimizer', 'critic', 'final'],
      executionMode: agentConfig?.executionMode || 'hybrid',
      maxRetries: agentConfig?.maxRetries || 2,
    },
    attachedDocuments: attachedDocuments || [],
    status: 'queued',
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalTasks': 1 } });

  // Start async — delay 4s so frontend can navigate + join socket room first
  runTaskAsync(task._id, req.user._id, task.description, task.agentConfig, task.attachedDocuments);

  res.status(201).json({ success: true, task });
};

const runTaskAsync = async (taskId, userId, description, agentConfig, attachedDocuments = []) => {
  // Give frontend time to navigate to workspace and join the socket room
  await new Promise(r => setTimeout(r, 4000));

  const orchestrator = new AgentOrchestrator(taskId, userId);
  try {
    const io = getSocketIO();
    await orchestrator.execute(description, agentConfig, (chunk) => {
      io.to(`task:${taskId}`).emit('agent:stream_chunk', { chunk, agentType: 'final' });
      io.to(`user:${userId}`).emit('agent:stream_chunk', { chunk, agentType: 'final', taskId });
    }, attachedDocuments);
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.completedTasks': 1 } });
  } catch (err) {
    logger.error(`Task ${taskId} failed: ${err.message}`);
  }
};

export const getTasks = async (req, res) => {
  const { status, category, page = 1, limit = 20, sort = '-createdAt' } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (category) filter.category = category;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).select('-finalOutput').lean(),
    Task.countDocuments(filter),
  ]);
  res.json({ success: true, tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

export const getTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) throw new AppError('Task not found', 404);
  res.json({ success: true, task });
};

export const getTaskLogs = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) throw new AppError('Task not found', 404);
  const logs = await AgentLog.find({ taskId: req.params.id }).sort({ timestamp: 1 }).lean();
  res.json({ success: true, logs });
};

export const deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) throw new AppError('Task not found', 404);
  await AgentLog.deleteMany({ taskId: req.params.id });
  res.json({ success: true, message: 'Task deleted' });
};

export const retryTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) throw new AppError('Task not found', 404);
  if (!['failed', 'cancelled'].includes(task.status)) throw new AppError('Only failed tasks can be retried', 400);
  await Task.findByIdAndUpdate(task._id, {
    status: 'queued', finalOutput: '', subtasks: [], error: null,
    startedAt: null, completedAt: null, 'executionStats.totalTokens': 0,
  });
  runTaskAsync(task._id, req.user._id, task.description, task.agentConfig, task.attachedDocuments);
  res.json({ success: true, message: 'Task restarted' });
};
