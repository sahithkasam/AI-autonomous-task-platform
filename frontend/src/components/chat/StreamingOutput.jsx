import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function StreamingOutput({ content, isStreaming, title = 'Final Response' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(content); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); };
  if (!content && !isStreaming) return null;
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-green-500/60" /></div>
          <span className="text-sm font-medium text-gray-300">{title}</span>
          {isStreaming && <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30"><span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />Streaming</span>}
        </div>
        {content && <button onClick={handleCopy} className="btn-ghost py-1 px-2 text-xs">{copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}</button>}
      </div>
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {isStreaming && !content && <div className="flex items-center gap-2 py-2"><span className="text-xs text-gray-500">AI is generating</span><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="typing-dot w-1.5 h-1.5 bg-brand-400 rounded-full" />)}</div></div>}
        {content && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          {isStreaming && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }} className="inline-block w-0.5 h-5 bg-brand-400 ml-1 align-middle" />}
        </motion.div>}
      </div>
    </div>
  );
}
