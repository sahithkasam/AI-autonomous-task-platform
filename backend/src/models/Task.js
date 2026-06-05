import mongoose from 'mongoose';
const subtaskSchema = new mongoose.Schema({
  id: String, title: String, description: String,
  assignedAgent: { type: String, enum: ['planner','research','optimizer','memory','critic','final'] },
  status: { type: String, enum: ['pending','in_progress','completed','failed','skipped'], default: 'pending' },
  output: String, startedAt: Date, completedAt: Date,
  tokensUsed: { type: Number, default: 0 }, confidence: { type: Number, default: 0 },
});
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['travel','business','technical','fitness','research','education','finance','creative','other'], default: 'other' },
  status: { type: String, enum: ['queued','planning','executing','reviewing','completed','failed','cancelled'], default: 'queued', index: true },
  priority: { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  subtasks: [subtaskSchema],
  finalOutput: { type: String, default: '' },
  agentConfig: {
    enabledAgents: [String],
    executionMode: { type: String, default: 'hybrid' },
    maxRetries: { type: Number, default: 2 },
    customPrompt: String,
  },
  executionStats: {
    totalTokens: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    executionTimeMs: { type: Number, default: 0 },
    agentRounds: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
  },
  attachedDocuments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  error: String, startedAt: Date, completedAt: Date,
}, { timestamps: true });
export default mongoose.model('Task', taskSchema);
