import Task from '../models/Task.js';
import AgentLog from '../models/AgentLog.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res) => {
  const userId = req.user._id;
  const [taskStats, agentStats, recentTasks, user] = await Promise.all([
    Task.aggregate([{ $match: { userId } }, { $group: { _id: '$status', count: { $sum: 1 }, totalTokens: { $sum: '$executionStats.totalTokens' }, avgTime: { $avg: '$executionStats.executionTimeMs' } } }]),
    AgentLog.aggregate([{ $match: { userId } }, { $group: { _id: '$agentType', count: { $sum: 1 }, totalTokens: { $sum: '$tokensUsed' }, avgLatency: { $avg: '$latencyMs' } } }]),
    Task.find({ userId }).sort('-createdAt').limit(5).select('title status category createdAt executionStats').lean(),
    User.findById(userId).select('stats').lean(),
  ]);
  const statusMap = {};
  taskStats.forEach(s => { statusMap[s._id] = { count: s.count, totalTokens: s.totalTokens, avgTime: s.avgTime }; });
  const totalTokensAll = taskStats.reduce((acc, s) => acc + (s.totalTokens || 0), 0);
  const categoryStats = await Task.aggregate([{ $match: { userId } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const dailyTasks = await Task.aggregate([{ $match: { userId, createdAt: { $gte: twoWeeksAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  res.json({ success: true, stats: { tasksByStatus: statusMap, agentUsage: agentStats, totalTasks: user?.stats?.totalTasks || 0, completedTasks: user?.stats?.completedTasks || 0, totalTokensUsed: totalTokensAll, estimatedCost: parseFloat(((totalTokensAll / 1_000_000) * 0.59).toFixed(4)), categoryBreakdown: categoryStats, dailyActivity: dailyTasks, recentTasks } });
};
