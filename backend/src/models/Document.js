import mongoose from 'mongoose';
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  filePath: { type: String, required: true },
  content: String,
  chunks: [{ text: String, index: Number }],
  status: { type: String, enum: ['processing','ready','failed'], default: 'processing' },
  metadata: { pageCount: Number, wordCount: Number },
}, { timestamps: true });
export default mongoose.model('Document', documentSchema);
