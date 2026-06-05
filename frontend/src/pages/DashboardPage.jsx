import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart2, CheckCircle, Activity, DollarSign, ArrowRight, Brain, Plus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import clsx from 'clsx';

const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
const STATUS_COLORS = { completed:'bg-green-500/20 text-green-400 border-green-500/30', executing:'bg-brand-500/20 text-brand-400 border-brand-500/30', planning:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', failed:'bg-red-500/20 text-red-400 border-red-500/30', queued:'bg-gray-500/20 text-gray-400 border-gray-500/30' };

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand' }) => (
  <div className="glass rounded-xl p-5">
    <div className={`w-9 h-9 rounded-lg bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center mb-3`}><Icon size={18} className={`text-${color}-400`} /></div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-gray-400">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => analyticsAPI.getDashboard().then(r => r.data.stats) });
  const stats = data || {};
  const completed = stats.tasksByStatus?.completed?.count || 0;
  const total = stats.totalTasks || 0;
  const tokens = stats.totalTokensUsed || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-white">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋</h1><p className="text-gray-400 mt-1">Here's your AI workspace overview</p></div>
        <button onClick={() => navigate('/workspace')} className="btn-primary"><Plus size={16} />New Task</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BarChart2} label="Total Tasks" value={total} color="brand" />
        <StatCard icon={CheckCircle} label="Completed" value={completed} sub={`${total ? Math.round((completed/total)*100) : 0}% success`} color="green" />
        <StatCard icon={Activity} label="Tokens Used" value={tokens > 1000 ? `${(tokens/1000).toFixed(1)}K` : tokens} color="yellow" />
        <StatCard icon={DollarSign} label="Est. Cost" value={`$${stats.estimatedCost || 0}`} sub="Groq LLaMA 3.3 70B" color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="font-semibold text-gray-300 mb-4">Task Activity (14 days)</h3>
          {isLoading ? <div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats.dailyActivity || []}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="_id" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }} itemStyle={{ color:'#6366f1' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#g)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-gray-300 mb-4">By Category</h3>
          {!isLoading && stats.categoryBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}><PieChart><Pie data={stats.categoryBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>{stats.categoryBreakdown.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip contentStyle={{ background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }}/></PieChart></ResponsiveContainer>
              <div className="space-y-2 mt-2">{stats.categoryBreakdown.slice(0,4).map((c,i) => <div key={c._id} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background:PIE_COLORS[i%PIE_COLORS.length] }}/><span className="text-gray-400 capitalize">{c._id}</span></div><span className="text-gray-300">{c.count}</span></div>)}</div>
            </>
          ) : <div className="h-36 flex items-center justify-center text-gray-600 text-sm">No data yet</div>}
        </div>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-gray-300">Recent Tasks</h3>
          <Link to="/history" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading ? <div className="py-12 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>
          : stats.recentTasks?.length ? stats.recentTasks.map(task => (
            <div key={task._id} className="flex items-center justify-between px-6 py-4 hover:bg-white/3 cursor-pointer transition-colors" onClick={() => navigate(`/workspace/${task._id}`)}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center"><Brain size={14} className="text-brand-400" /></div>
                <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{task.title}</p><p className="text-xs text-gray-500 capitalize">{task.category}</p></div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className={clsx('badge border text-xs capitalize', STATUS_COLORS[task.status] || STATUS_COLORS.queued)}>{task.status}</span>
                <span className="text-xs text-gray-600 hidden sm:block">{format(new Date(task.createdAt),'MMM d')}</span>
                <ArrowRight size={14} className="text-gray-600" />
              </div>
            </div>
          )) : <div className="py-12 text-center"><Brain size={32} className="text-gray-600 mx-auto mb-3"/><p className="text-gray-500 text-sm">No tasks yet</p><button onClick={() => navigate('/workspace')} className="btn-primary mt-4 mx-auto"><Plus size={14}/>Create first task</button></div>}
        </div>
      </div>
    </div>
  );
}
