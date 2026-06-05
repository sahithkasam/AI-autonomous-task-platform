import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Zap, Database, Shield, Star, Activity, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const ICONS = { planner:Brain, research:Search, optimizer:Zap, memory:Database, critic:Shield, final:Star };
const STYLES = { started:'border-l-brand-500 bg-brand-500/5', thinking:'border-l-yellow-500 bg-yellow-500/5', completed:'border-l-green-500 bg-green-500/5', error:'border-l-red-500 bg-red-500/5', retrying:'border-l-orange-500 bg-orange-500/5', status:'border-l-purple-500 bg-purple-500/5', done:'border-l-green-400 bg-green-400/10', orchestrator:'border-l-brand-400 bg-brand-400/5', plan:'border-l-cyan-500 bg-cyan-500/5', subtask:'border-l-gray-500 bg-gray-500/5' };

export default function AgentEventFeed({ events }) {
  if (!events.length) return <div className="flex flex-col items-center justify-center h-40 text-gray-500"><Activity size={24} className="mb-2 opacity-30" /><p className="text-sm">Waiting for agent activity...</p></div>;
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {events.slice().reverse().map((event) => {
          const Icon = ICONS[event.agentType] || Activity;
          return (
            <motion.div key={event.id} initial={{ opacity: 0, x: -10, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} transition={{ duration: 0.2 }} className={clsx('border-l-2 pl-3 py-2 pr-2 rounded-r-lg text-xs', STYLES[event.type] || STYLES.status)}>
              <div className="flex items-center gap-2 mb-0.5">
                <Icon size={12} className="text-gray-400 flex-shrink-0" />
                {event.agentType && <span className="font-medium text-gray-300 capitalize">{event.agentType}</span>}
                <span className="ml-auto text-gray-600 font-mono">{format(event.timestamp || new Date(), 'HH:mm:ss')}</span>
              </div>
              <p className="text-gray-400 leading-relaxed">{event.message || event.data?.message || event.type}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
