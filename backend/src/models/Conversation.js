import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user','assistant','system','agent'], required: true },
  content: { type: String, required: true },
  agentType: String,
  timestamp: { type: Date, default: Date.now },
});
const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  title: { type: String, default: 'New Conversation' },
  messages: [messageSchema],
  totalTokens: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Conversation', conversationSchema);
