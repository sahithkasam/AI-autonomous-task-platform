import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Search, Zap, Database, Shield, Star, ArrowRight, Sparkles, BarChart2, Globe, Lock, ChevronRight } from 'lucide-react';

const AGENTS = [{ icon:Brain,label:'Planner',desc:'Breaks your goal into smart subtasks',color:'violet' },{ icon:Search,label:'Research',desc:'Gathers deep, relevant information',color:'blue' },{ icon:Zap,label:'Optimizer',desc:'Refines and enhances outputs',color:'yellow' },{ icon:Database,label:'Memory',desc:'Remembers your preferences',color:'green' },{ icon:Shield,label:'Critic',desc:'Reviews quality and completeness',color:'red' },{ icon:Star,label:'Final',desc:'Delivers your polished response',color:'orange' }];
const FEATURES = [{ icon:Sparkles,title:'Multi-Agent Collaboration',desc:'6 specialized AI agents work together to solve complex tasks.' },{ icon:BarChart2,title:'Real-Time Execution',desc:'Watch agents stream their findings live via WebSocket.' },{ icon:Database,title:'AI Memory System',desc:'Persistent memory learns your preferences and improves.' },{ icon:Globe,title:'RAG Pipeline',desc:'Upload documents for domain-specific knowledge.' },{ icon:Lock,title:'Secure & Private',desc:'JWT auth, rate limiting, and secure API design.' },{ icon:BarChart2,title:'Analytics Dashboard',desc:'Track tokens, cost, confidence, and agent performance.' }];
const colorGrad = { violet:'from-violet-600 to-purple-700', blue:'from-blue-600 to-cyan-700', yellow:'from-yellow-500 to-amber-600', green:'from-green-600 to-emerald-700', red:'from-red-600 to-rose-700', orange:'from-orange-500 to-amber-600' };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center"><Brain size={18} className="text-white" /></div><span className="text-lg font-bold glow-text">AgentFlow</span></div>
          <div className="flex items-center gap-4"><Link to="/login" className="text-sm text-gray-400 hover:text-white">Sign In</Link><Link to="/register" className="btn-primary text-sm py-2">Get Started <ArrowRight size={14} /></Link></div>
        </div>
      </header>
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"><div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl" /><div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" /></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-brand-300 mb-8 border border-brand-500/30"><Sparkles size={14} />Powered by Groq LLaMA 3.3 70B</div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">Your Personal<br /><span className="glow-text">AI Agent Team</span></h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">Give a complex goal. Watch 6 specialized AI agents plan, research, optimize, and deliver a comprehensive solution — in real time.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-base px-8 py-3.5 justify-center"><Sparkles size={18} />Start for Free<ArrowRight size={16} /></Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-3.5 justify-center">Sign In</Link>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Meet Your <span className="glow-text">AI Team</span></h2><p className="text-gray-400 text-lg max-w-xl mx-auto">Each agent is a specialist. Together, they solve problems no single AI can handle alone.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map((agent, i) => { const Icon = agent.icon; return (
              <motion.div key={agent.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass glass-hover rounded-2xl p-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorGrad[agent.color]} rounded-xl flex items-center justify-center mb-4`}><Icon size={22} className="text-white" /></div>
                <h3 className="text-lg font-semibold text-white mb-2">{agent.label} Agent</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{agent.desc}</p>
              </motion.div>
            ); })}
          </div>
        </div>
      </section>
      <section className="py-20 px-6 bg-surface-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold text-white mb-4">Production-Grade <span className="glow-text">Features</span></h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => { const Icon = f.icon; return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="glass rounded-2xl p-6">
                <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center mb-4 border border-brand-500/30"><Icon size={20} className="text-brand-400" /></div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ); })}
          </div>
        </div>
      </section>
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass rounded-3xl p-12 border border-brand-500/20">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-glow"><Brain size={28} className="text-white" /></div>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to let AI do the heavy lifting?</h2>
            <p className="text-gray-400 mb-8 text-lg">Experience what 6 coordinated AI agents can accomplish.</p>
            <Link to="/register" className="btn-primary text-base px-10 py-4 justify-center inline-flex"><Sparkles size={20} />Get Started — It's Free<ChevronRight size={18} /></Link>
          </motion.div>
        </div>
      </section>
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><Brain size={16} className="text-brand-400" /><span className="text-sm text-gray-500">AgentFlow — AI Multi-Agent Platform</span></div>
          <p className="text-xs text-gray-600">MERN + Groq LLaMA 3.3 70B</p>
        </div>
      </footer>
    </div>
  );
}
