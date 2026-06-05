import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try { await register(form); toast.success('Welcome to AgentFlow!'); navigate('/dashboard'); } catch {}
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" /><div className="absolute -bottom-40 -right-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center"><Brain size={24} className="text-white" /></div>
          <span className="text-2xl font-bold glow-text">AgentFlow</span>
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-gray-400 mb-8">Start with 6 specialized AI agents</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm text-gray-400 mb-1.5 block">Name</label><div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="input-field pl-10" required /></div></div>
            <div><label className="text-sm text-gray-400 mb-1.5 block">Email</label><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input-field pl-10" required /></div></div>
            <div><label className="text-sm text-gray-400 mb-1.5 block">Password</label><div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type={showPass?'text':'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" className="input-field pl-10 pr-10" required /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPass?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3 mt-2">{isLoading?<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Sparkles size={18}/>Create Account</>}</button>
          </form>
          <p className="text-center text-gray-500 text-sm mt-6">Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
