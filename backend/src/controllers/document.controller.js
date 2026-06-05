import fs from 'fs';
import Document from '../models/Document.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export const uploadDocument = async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const doc = await Document.create({ userId: req.user._id, filename: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, filePath: req.file.path, status: 'processing' });
  processDocumentAsync(doc._id, req.file.path, req.file.mimetype);
  res.status(201).json({ success: true, document: doc });
};

const processDocumentAsync = async (docId, filePath, mimeType) => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const chunkSize = 800;
    const words = content.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) chunks.push({ text: words.slice(i, i + chunkSize).join(' '), index: chunks.length });
    await Document.findByIdAndUpdate(docId, { content: content.slice(0, 50000), chunks, status: 'ready', 'metadata.wordCount': wordCount });
  } catch (err) {
    logger.error(`Doc processing failed: ${err.message}`);
    await Document.findByIdAndUpdate(docId, { status: 'failed' });
  }
};

export const getDocuments = async (req, res) => {
  const documents = await Document.find({ userId: req.user._id }).select('-content -chunks').sort('-createdAt').lean();
  res.json({ success: true, documents });
};

export const deleteDocument = async (req, res) => {
  const doc = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!doc) throw new AppError('Document not found', 404);
  try { fs.unlinkSync(doc.filePath); } catch {}
  res.json({ success: true, message: 'Document deleted' });
};

export const searchDocuments = async (req, res) => {
  const { query, documentIds } = req.body;
  if (!query) throw new AppError('Query is required', 400);
  const filter = { userId: req.user._id, status: 'ready' };
  if (documentIds?.length) filter._id = { $in: documentIds };
  const docs = await Document.find(filter).select('originalName content chunks').lean();
  const queryLower = query.toLowerCase();
  const results = docs.map(doc => ({ documentId: doc._id, name: doc.originalName, chunks: (doc.chunks || []).filter(c => c.text?.toLowerCase().includes(queryLower)).slice(0, 3).map(c => c.text) })).filter(r => r.chunks.length > 0);
  res.json({ success: true, results });
};
