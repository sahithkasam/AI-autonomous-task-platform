import { motion } from 'framer-motion';
import { Brain, Search, Zap, Database, Shield, Star, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import clsx from 'clsx';

const AGENTS = { planner:{icon:Brain,color:'violet',label:'Planner'}, research:{icon:Search,color:'blue',label:'Research'}, optimizer:{icon:Zap,color:'yellow',label:'Optimizer'}, memory:{icon:Database,color:'green',label:'Memory'}, critic:{icon:Shield,color:'red',label:'Critic'}, final:{icon:Star,color:'orange',label:'Final'} };
const COLORS = { violet:'from-violet-600 to-purple-700 border-violet-500/20', blue:'from-blue-600 to-cyan-700 border-blue-500/20', yellow:'from-yellow-500 to-amber-600 border-yellow-500/20', green:'from-green-600 to-emerald-700 border-green-500/20', red:'from-red-600 to-rose-700 border-red-500/20', orange:'from-orange-500 to-amber-600 border-orange-500/20' };

export default function AgentStatusCard({ agentType, status='pending', message='', confidence=0 }) {
  const cfg = AGENTS[agentType] || AGENTS.planner;
  const colors = COLORS[cfg.color];
  const Icon = cfg.icon;
  const isActive = status === 'in_progress';
  const [gradient, _, border] = colors.split(' ');
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={clsx('relative glass rounded-xl p-4 border overflow-hidden', border, isActive && 'agent-active')}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} to-transparent flex-shrink-0`}><Icon size={16} className="text-white" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-white">{cfg.label} Agent</span>
            {status === 'completed' && <CheckCircle size={14} className="text-green-400" />}
            {status === 'failed' && <AlertCircle size={14} className="text-red-400" />}
            {status === 'in_progress' && <Loader size={14} className="text-brand-400 animate-spin" />}
            {status === 'pending' && <Clock size={14} className="text-gray-500" />}
          </div>
          <p className="text-xs text-gray-400 truncate">{message || cfg.label + ' waiting...'}</p>
          {confidence > 0 && status === 'completed' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Confidence</span><span className="text-green-400">{Math.round(confidence*100)}%</span></div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${confidence*100}%` }} className="h-full bg-green-400 rounded-full" /></div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
