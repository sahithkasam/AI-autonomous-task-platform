import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Zap, History, Settings, LogOut, Brain, ChevronRight, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/workspace', icon: Zap, label: 'Workspace' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = ({ mobile = false }) => (
    <div className={clsx('flex flex-col h-full bg-surface-800 border-r border-white/10 transition-all duration-300', collapsed && !mobile ? 'w-16' : 'w-64')}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0"><Brain size={20} className="text-white" /></div>
        {(!collapsed || mobile) && <span className="font-bold text-lg glow-text">AgentFlow</span>}
        {!mobile && <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-gray-500 hover:text-white"><ChevronRight size={16} className={clsx('transition-transform', collapsed && 'rotate-180')} /></button>}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200', active ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
              <Icon size={18} className="flex-shrink-0" />
              {(!collapsed || mobile) && <span className="font-medium text-sm">{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className={clsx('flex items-center gap-3 px-3 py-2', collapsed && !mobile && 'justify-center')}>
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</div>
          {(!collapsed || mobile) && <><div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user?.name}</p><p className="text-xs text-gray-500 truncate">{user?.email}</p></div><button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors"><LogOut size={16} /></button></>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex flex-col"><SidebarContent /></div>
      {mobileOpen && <div className="fixed inset-0 z-50 md:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} /><div className="relative w-64 h-full"><SidebarContent mobile /></div></div>}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-800 border-b border-white/10">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white"><Menu size={20} /></button>
          <span className="font-bold glow-text">AgentFlow</span>
        </div>
        <main className="flex-1 overflow-auto bg-surface-900">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">{children}</motion.div>
        </main>
      </div>
    </div>
  );
}
