import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Trash2, RefreshCw, ArrowRight, Brain, CheckCircle, AlertCircle, Clock, Loader, BarChart2, Calendar, Plus } from 'lucide-react';
import { taskAPI } from '../utils/api';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STATUS_CFG = { completed:{icon:CheckCircle,color:'text-green-400',bg:'bg-green-500/10 border-green-500/20'}, executing:{icon:Loader,color:'text-brand-400',bg:'bg-brand-500/10 border-brand-500/20'}, planning:{icon:Loader,color:'text-yellow-400',bg:'bg-yellow-500/10 border-yellow-500/20'}, failed:{icon:AlertCircle,color:'text-red-400',bg:'bg-red-500/10 border-red-500/20'}, queued:{icon:Clock,color:'text-gray-400',bg:'bg-gray-500/10 border-gray-500/20'} };
const CAT_COLORS = { travel:'text-cyan-400', business:'text-blue-400', technical:'text-violet-400', fitness:'text-green-400', research:'text-yellow-400', education:'text-orange-400', finance:'text-emerald-400', creative:'text-pink-400', other:'text-gray-400' };

export default function HistoryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data, isLoading } = useQuery({ queryKey:['tasks',{status:statusFilter,page}], queryFn:() => taskAPI.getAll({ status:statusFilter, page, limit:15 }).then(r => r.data) });
  const deleteMutation = useMutation({ mutationFn:(id) => taskAPI.delete(id), onSuccess:() => { qc.invalidateQueries({ queryKey:['tasks'] }); setDeleteConfirm(null); toast.success('Task deleted'); } });
  const retryMutation = useMutation({ mutationFn:(id) => taskAPI.retry(id), onSuccess:(_,id) => { qc.invalidateQueries({ queryKey:['tasks'] }); navigate(`/workspace/${id}`); } });

  const tasks = (data?.tasks || []).filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-white">Task History</h1><p className="text-gray-400 mt-1">All your AI-powered tasks</p></div>
        <button onClick={() => navigate('/workspace')} className="btn-primary"><Brain size={16} />New Task</button>
      </div>
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="input-field pl-10 py-2.5 text-sm" /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field py-2.5 text-sm w-40">{['','queued','planning','executing','reviewing','completed','failed'].map(s => <option key={s} value={s} className="bg-surface-700">{s || 'All Status'}</option>)}</select>
      </div>
      {isLoading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>
      : !tasks.length ? <div className="glass rounded-2xl py-20 text-center"><Brain size={48} className="text-gray-700 mx-auto mb-4" /><p className="text-gray-400 text-lg">No tasks found</p><button onClick={() => navigate('/workspace')} className="btn-primary mt-4 mx-auto"><Plus size={14}/>Create task</button></div>
      : <div className="space-y-3">
          {tasks.map((task, i) => { const cfg = STATUS_CFG[task.status] || STATUS_CFG.queued; const Icon = cfg.icon; return (
            <motion.div key={task._id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }} className="glass glass-hover rounded-xl p-4 flex items-center gap-4 cursor-pointer group" onClick={() => navigate(`/workspace/${task._id}`)}>
              <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center"><Brain size={18} className="text-brand-400" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><p className="font-medium text-white text-sm truncate">{task.title}</p><span className={clsx('badge text-xs border capitalize', cfg.bg, cfg.color)}><Icon size={10} />{task.status}</span></div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className={clsx('capitalize', CAT_COLORS[task.category])}>{task.category}</span><span>·</span>
                  <span className="flex items-center gap-1"><Calendar size={10} />{format(new Date(task.createdAt),'MMM d, yyyy')}</span>
                  {task.executionStats?.totalTokens > 0 && <><span>·</span><span className="flex items-center gap-1"><BarChart2 size={10} />{task.executionStats.totalTokens.toLocaleString()} tok</span></>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {task.status === 'failed' && <button onClick={() => retryMutation.mutate(task._id)} className="btn-secondary py-1.5 text-xs"><RefreshCw size={12} /></button>}
                <button onClick={() => setDeleteConfirm(task._id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={14} /></button>
                <ArrowRight size={16} className="text-gray-600 group-hover:text-brand-400 transition-colors" />
              </div>
            </motion.div>
          ); })}
        </div>}
      {data?.pages > 1 && <div className="flex justify-center gap-2 mt-6">{Array.from({ length: data.pages }, (_, i) => i+1).map(p => <button key={p} onClick={() => setPage(p)} className={clsx('w-9 h-9 rounded-lg text-sm transition-all', p===page?'bg-brand-600 text-white':'glass text-gray-400 hover:text-white')}>{p}</button>)}</div>}
      {deleteConfirm && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass rounded-2xl p-6 max-w-sm w-full"><h3 className="text-lg font-bold text-white mb-2">Delete Task?</h3><p className="text-gray-400 text-sm mb-6">This cannot be undone. All agent logs will be removed.</p><div className="flex gap-3"><button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button><button onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-2">{deleteMutation.isPending?<Loader size={14} className="animate-spin"/>:<Trash2 size={14}/>}Delete</button></div></motion.div></div>}
    </div>
  );
}
