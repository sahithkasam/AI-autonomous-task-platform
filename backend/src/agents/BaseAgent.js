import { generateContent, streamContent } from '../config/groq.js';
import AgentLog from '../models/AgentLog.js';
import { logger } from '../utils/logger.js';
import { getSocketIO } from '../socket/socketManager.js';

export class BaseAgent {
  constructor(type, taskId, userId) {
    this.type = type;
    this.taskId = taskId;
    this.userId = userId;
    this.maxRetries = 3;
  }

  isRateLimitError(err) {
    return err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('rate_limit') || err?.message?.includes('Rate limit');
  }

  extractRetryDelay(err) {
    // Groq returns retry-after in the error
    const match = err?.message?.match(/try again in ([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1])) * 1000 + 500;
    const match2 = err?.headers?.['retry-after'];
    if (match2) return parseInt(match2) * 1000 + 500;
    return 8000;
  }

  async emit(event, data) {
    try {
      const io = getSocketIO();
      const payload = { agentType: this.type, ...data };
      io.to(`task:${this.taskId}`).emit(event, payload);
      io.to(`user:${this.userId}`).emit(event, { taskId: this.taskId, ...payload });
    } catch {}
  }

  async log(action, input, output, status, extra = {}) {
    try {
      await AgentLog.create({
        taskId: this.taskId,
        userId: this.userId,
        agentType: this.type,
        action,
        input: String(input).slice(0, 2000),
        output: String(output).slice(0, 5000),
        status,
        ...extra,
      });
    } catch (err) {
      logger.warn(`Log failed: ${err.message}`);
    }
  }

  async generate(prompt, options = {}) {
    const start = Date.now();
    await this.emit('agent:thinking', { message: `${this.type} agent is thinking...` });
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await generateContent(prompt, options);
        await this.log('generate', prompt.slice(0, 500), result.text, 'completed', {
          tokensUsed: result.tokensUsed, latencyMs: Date.now() - start, retryCount: attempt,
        });
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const delay = this.isRateLimitError(err) ? this.extractRetryDelay(err) : 2000 * (attempt + 1);
          await this.emit('agent:retrying', { attempt: attempt + 1, message: `Waiting ${Math.round(delay/1000)}s...` });
          logger.warn(`${this.type} retrying (attempt ${attempt + 1}), delay ${Math.round(delay/1000)}s`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    await this.log('generate', prompt.slice(0, 500), lastError?.message, 'failed');
    throw lastError;
  }

  async generateStream(prompt, onChunk, options = {}) {
    const start = Date.now();
    await this.emit('agent:streaming_start', { message: `${this.type} agent streaming...` });
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await streamContent(prompt, (chunk) => {
          this.emit('agent:stream_chunk', { chunk });
          onChunk(chunk);
        }, options);
        await this.emit('agent:streaming_end', { message: 'Stream complete' });
        await this.log('stream', prompt.slice(0, 500), result.text.slice(0, 2000), 'completed', {
          tokensUsed: result.tokensUsed, latencyMs: Date.now() - start,
        });
        return result;
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const delay = this.isRateLimitError(err) ? this.extractRetryDelay(err) : 2000 * (attempt + 1);
          await this.emit('agent:retrying', { attempt: attempt + 1, message: `Rate limited, waiting ${Math.round(delay/1000)}s...` });
          logger.warn(`${this.type} stream retry ${attempt + 1}, delay ${Math.round(delay/1000)}s`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  parseJSON(text) {
    try { return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()); }
    catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { return JSON.parse(m[0]); } catch {} }
      return null;
    }
  }
}
