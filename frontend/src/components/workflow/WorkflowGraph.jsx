import { motion } from 'framer-motion';
import { Brain, Search, Zap, Database, Shield, Star, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const NODES = [
  { id:'memory', label:'Memory', icon:Database, color:'green', col:0 },
  { id:'planner', label:'Planner', icon:Brain, color:'violet', col:1 },
  { id:'research', label:'Research', icon:Search, color:'blue', col:2 },
  { id:'optimizer', label:'Optimizer', icon:Zap, color:'yellow', col:2 },
  { id:'critic', label:'Critic', icon:Shield, color:'red', col:3 },
  { id:'final', label:'Final', icon:Star, color:'orange', col:4 },
];
const COLORS = { green:'bg-green-500/20 border-green-500/40 text-green-300', violet:'bg-violet-500/20 border-violet-500/40 text-violet-300', blue:'bg-blue-500/20 border-blue-500/40 text-blue-300', yellow:'bg-yellow-500/20 border-yellow-500/40 text-yellow-300', red:'bg-red-500/20 border-red-500/40 text-red-300', orange:'bg-orange-500/20 border-orange-500/40 text-orange-300' };

export default function WorkflowGraph({ subtasks = [] }) {
  const getStatus = (id) => subtasks.find(s => s.assignedAgent === id)?.status || 'pending';
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Agent Workflow</h3>
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] gap-2 py-4">
          {[0,1,2,3,4].map(col => (
            <div key={col} className="flex flex-col gap-3 items-center">
              {NODES.filter(n => n.col === col).map(node => {
                const status = getStatus(node.id);
                const c = COLORS[node.color];
                const Icon = node.icon;
                const isActive = status === 'in_progress';
                return (
                  <motion.div key={node.id} animate={isActive ? { scale:[1,1.05,1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}
                    className={clsx('flex flex-col items-center gap-2 p-3 rounded-xl border transition-all', c, status === 'pending' && 'opacity-40', status === 'completed' && 'opacity-90', isActive && 'opacity-100 shadow-lg')}>
                    <Icon size={18} className={c.split(' ')[2]} />
                    <span className={clsx('text-xs font-medium', c.split(' ')[2])}>{node.label}</span>
                    <div className={clsx('w-1.5 h-1.5 rounded-full', status==='completed'?'bg-green-400':isActive?'bg-brand-400 animate-pulse':status==='failed'?'bg-red-400':'bg-gray-600')} />
                  </motion.div>
                );
              })}
              {col < 4 && <ArrowRight size={14} className="text-gray-600 absolute" style={{ display:'none' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
