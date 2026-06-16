import fs from 'fs';
import pdfParse from 'pdf-parse';
import Document from '../models/Document.js';
import { embedTexts, embedQuery } from '../config/embeddings.js';
import { logger } from '../utils/logger.js';

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

export const extractText = async (filePath, mimeType) => {
  const buffer = fs.readFileSync(filePath);
  if (mimeType === 'application/pdf') {
    const parsed = await pdfParse(buffer);
    return { text: parsed.text, pageCount: parsed.numpages };
  }
  if (mimeType === 'application/json') {
    return { text: JSON.stringify(JSON.parse(buffer.toString('utf-8')), null, 2), pageCount: null };
  }
  return { text: buffer.toString('utf-8'), pageCount: null };
};

// Splits on paragraph boundaries, packing them into ~CHUNK_SIZE-char windows with overlap
// so embeddings capture coherent ideas instead of arbitrary word cuts.
export const chunkText = (text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    if (current && (current.length + para.length + 2) > chunkSize) {
      chunks.push(current);
      current = current.slice(Math.max(0, current.length - overlap));
    }
    current = current ? `${current}\n\n${para}` : para;
    while (current.length > chunkSize * 1.5) {
      chunks.push(current.slice(0, chunkSize));
      current = current.slice(chunkSize - overlap);
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks.map((text, index) => ({ text: text.trim(), index })).filter((c) => c.text.length > 0);
};

export const processDocument = async (docId, filePath, mimeType) => {
  const { text, pageCount } = await extractText(filePath, mimeType);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const rawChunks = chunkText(text);

  if (rawChunks.length === 0) {
    await Document.findByIdAndUpdate(docId, { status: 'failed' });
    return;
  }

  const embeddings = await embedTexts(rawChunks.map((c) => c.text));
  const chunks = rawChunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));

  await Document.findByIdAndUpdate(docId, {
    content: text.slice(0, 50000),
    chunks,
    status: 'ready',
    'metadata.wordCount': wordCount,
    'metadata.pageCount': pageCount,
  });
};

const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const retrieveRelevantChunks = async ({ userId, query, documentIds = [], topK = 5, minScore = 0.55 }) => {
  const filter = { userId, status: 'ready' };
  if (documentIds.length) filter._id = { $in: documentIds };

  const docs = await Document.find(filter).select('originalName chunks').lean();
  const candidates = docs.flatMap((doc) => (doc.chunks || [])
    .filter((c) => Array.isArray(c.embedding) && c.embedding.length > 0)
    .map((c) => ({ documentId: doc._id, documentName: doc.originalName, text: c.text, embedding: c.embedding })));

  if (candidates.length === 0) return [];

  let queryEmbedding;
  try {
    queryEmbedding = await embedQuery(query);
  } catch (err) {
    logger.error(`RAG query embedding failed: ${err.message}`);
    return [];
  }

  return candidates
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ embedding, ...rest }) => rest);
};

export const formatContextForPrompt = (results) => {
  if (!results.length) return '';
  return results
    .map((r, i) => `[Source ${i + 1}: ${r.documentName}]\n${r.text}`)
    .join('\n\n---\n\n');
};
