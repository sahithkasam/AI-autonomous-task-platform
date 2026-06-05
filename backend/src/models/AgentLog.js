import mongoose from 'mongoose';
const agentLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentType: { type: String, enum: ['planner','research','optimizer','memory','critic','final','orchestrator'], required: true },
  action: String, input: String, output: String,
  status: { type: String, enum: ['started','thinking','completed','failed','retrying'], default: 'started' },
  retryCount: { type: Number, default: 0 },
  tokensUsed: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  error: String,
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false });
export default mongoose.model('AgentLog', agentLogSchema);
