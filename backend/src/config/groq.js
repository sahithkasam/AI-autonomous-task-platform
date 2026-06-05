import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

let groqClient = null;

export const getGroqClient = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) logger.warn('GROQ_API_KEY not set');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

export const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export const generateContent = async (prompt, options = {}) => {
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: options.model || DEFAULT_MODEL,
    temperature: 0.7,
    max_tokens: 4096,
  });
  const text = completion.choices[0]?.message?.content || '';
  const usage = completion.usage;
  return {
    text,
    tokensUsed: usage?.total_tokens || 0,
    promptTokens: usage?.prompt_tokens || 0,
    outputTokens: usage?.completion_tokens || 0,
  };
};

export const streamContent = async (prompt, onChunk, options = {}) => {
  const client = getGroqClient();
  const stream = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: options.model || DEFAULT_MODEL,
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  });
  let fullText = '';
  let totalTokens = 0;
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullText += content;
      onChunk(content);
    }
    if (chunk.x_groq?.usage) totalTokens = chunk.x_groq.usage.total_tokens || 0;
  }
  return { text: fullText, tokensUsed: totalTokens };
};
