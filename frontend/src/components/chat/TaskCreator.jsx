import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Settings2, Brain, Search, Zap, Database, Shield, Star, ChevronDown, FileText } from 'lucide-react';
import clsx from 'clsx';
import { documentAPI } from '../../utils/api';

const EXAMPLES = ['Plan a 5-day Goa trip under ₹25,000','Create a startup launch strategy for a SaaS product','Prepare a full-stack interview roadmap for FAANG','Build a 12-week fitness and meal plan for weight loss','Research and compare laptops for AI/ML development'];
const AGENTS = [{ id:'research',label:'Research',icon:Search },{ id:'optimizer',label:'Optimizer',icon:Zap },{ id:'memory',label:'Memory',icon:Database },{ id:'critic',label:'Critic',icon:Shield },{ id:'final',label:'Final',icon:Star }];

export default function TaskCreator({ onSubmit, isLoading }) {
  const [description, setDescription] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState(['research', 'optimizer', 'critic', 'final']);
  const [priority, setPriority] = useState('medium');
  const [attachedDocuments, setAttachedDocuments] = useState([]);

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentAPI.getAll().then((r) => r.data.documents),
  });
  const readyDocuments = (documents || []).filter((d) => d.status === 'ready');

  const toggleDocument = (id) => setAttachedDocuments((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || isLoading) return;
    onSubmit({ title: description.slice(0, 80) + (description.length > 80 ? '...' : ''), description, priority, agentConfig: { enabledAgents, executionMode: 'hybrid' }, attachedDocuments });
    setDescription('');
    setAttachedDocuments([]);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center"><Brain size={16} className="text-white" /></div><h2 className="font-semibold text-white">New Task</h2></div>
        <form onSubmit={handleSubmit}>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your goal... e.g. 'Plan a 5-day trip to Goa'" rows={4} className="input-field resize-none mb-4 text-sm" disabled={isLoading} onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSubmit(e); }} />
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">{EXAMPLES.map((ex) => <button key={ex} type="button" onClick={() => setDescription(ex)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-brand-600/20 text-gray-400 hover:text-brand-300 border border-white/10 hover:border-brand-500/30 transition-all">{ex.slice(0, 35)}...</button>)}</div>
          </div>
          <button type="button" onClick={() => setShowAdv(!showAdv)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 mb-4 transition-colors">
            <Settings2 size={14} />Agent Config<ChevronDown size={12} className={clsx('transition-transform', showAdv && 'rotate-180')} />
          </button>
          <AnimatePresence>{showAdv && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
            <div className="glass rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">Active Agents</p>
                <div className="flex flex-wrap gap-2">{AGENTS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setEnabledAgents(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id])} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all', enabledAgents.includes(id) ? 'bg-brand-600/20 border-brand-500/40 text-brand-300' : 'bg-white/5 border-white/10 text-gray-500')}><Icon size={12} />{label}</button>)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field py-2 text-sm">{['low','medium','high','urgent'].map(p => <option key={p} value={p} className="bg-surface-700 capitalize">{p}</option>)}</select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">Knowledge Base (RAG)</p>
                {readyDocuments.length ? (
                  <div className="flex flex-wrap gap-2">{readyDocuments.map((doc) => (
                    <button key={doc._id} type="button" onClick={() => toggleDocument(doc._id)} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all max-w-[180px]', attachedDocuments.includes(doc._id) ? 'bg-brand-600/20 border-brand-500/40 text-brand-300' : 'bg-white/5 border-white/10 text-gray-500')}>
                      <FileText size={12} className="flex-shrink-0" /><span className="truncate">{doc.originalName}</span>
                    </button>
                  ))}</div>
                ) : <p className="text-xs text-gray-600">No ready documents. Upload some in Settings to ground agents in your own knowledge base.</p>}
              </div>
            </div>
          </motion.div>}</AnimatePresence>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{description.length} chars · ⌘+Enter</span>
            <button type="submit" disabled={!description.trim() || isLoading} className="btn-primary">
              {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : <><Send size={16} />Run Agents</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
