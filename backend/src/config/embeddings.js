import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

let genAI = null;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const BATCH_SIZE = 100;

const getClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) logger.warn('GEMINI_API_KEY not set — document embedding will fail');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const withRetry = async (fn, retries = 3) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(1500 * (attempt + 1));
    }
  }
  throw lastError;
};

export const embedText = async (text, taskType = 'RETRIEVAL_DOCUMENT') => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await withRetry(() => model.embedContent({ content: { parts: [{ text }] }, taskType }));
  return result.embedding.values;
};

export const embedQuery = (text) => embedText(text, 'RETRIEVAL_QUERY');

export const embedTexts = async (texts) => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const embeddings = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const result = await withRetry(() => model.batchEmbedContents({
      requests: batch.map((text) => ({ model: `models/${EMBEDDING_MODEL}`, content: { parts: [{ text }] }, taskType: 'RETRIEVAL_DOCUMENT' })),
    }));
    embeddings.push(...result.embeddings.map((e) => e.values));
  }
  return embeddings;
};

export const EMBEDDING_MODEL_NAME = EMBEDDING_MODEL;
