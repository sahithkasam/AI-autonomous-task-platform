import fs from 'fs';
import Document from '../models/Document.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { processDocument, retrieveRelevantChunks } from '../services/ragService.js';

export const uploadDocument = async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const doc = await Document.create({ userId: req.user._id, filename: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, filePath: req.file.path, status: 'processing' });
  processDocumentAsync(doc._id, req.file.path, req.file.mimetype);
  res.status(201).json({ success: true, document: doc });
};

const processDocumentAsync = async (docId, filePath, mimeType) => {
  try {
    await processDocument(docId, filePath, mimeType);
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
  const { query, documentIds, topK } = req.body;
  if (!query) throw new AppError('Query is required', 400);
  const results = await retrieveRelevantChunks({ userId: req.user._id, query, documentIds: documentIds || [], topK: topK || 5 });
  res.json({ success: true, results });
};
