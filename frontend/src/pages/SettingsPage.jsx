import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Brain, Upload, X, CheckCircle, Loader, FileText } from 'lucide-react';
import { authAPI, documentAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';

const Section = ({ title, icon: Icon, children }) => (
  <div className="glass rounded-2xl overflow-hidden mb-6">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10"><Icon size={18} className="text-brand-400" /><h3 className="font-semibold text-white">{title}</h3></div>
    <div className="p-6">{children}</div>
  </div>
);

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ name: user?.name || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const { data: docsData, isLoading: docsLoading } = useQuery({ queryKey:['documents'], queryFn:() => documentAPI.getAll().then(r => r.data.documents) });
  const profileMutation = useMutation({ mutationFn:(d) => authAPI.updateMe(d), onSuccess:(r) => { updateUser(r.data.user); toast.success('Profile updated'); } });
  const passwordMutation = useMutation({ mutationFn:(d) => authAPI.changePassword(d), onSuccess:() => { setPasswords({ currentPassword:'', newPassword:'', confirm:'' }); toast.success('Password changed'); } });
  const uploadMutation = useMutation({ mutationFn:(file) => { const f = new FormData(); f.append('file', file); return documentAPI.upload(f); }, onSuccess:() => { qc.invalidateQueries({ queryKey:['documents'] }); toast.success('Document uploaded'); } });
  const deleteMutation = useMutation({ mutationFn:(id) => documentAPI.delete(id), onSuccess:() => qc.invalidateQueries({ queryKey:['documents'] }) });

  const handlePwdSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8"><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-gray-400 mt-1">Manage your profile and knowledge base</p></div>
      <Section title="Profile" icon={User}>
        <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold">{user?.name?.[0]?.toUpperCase()}</div><div><p className="text-white font-semibold">{user?.name}</p><p className="text-gray-400 text-sm">{user?.email}</p></div></div>
        <div className="space-y-4">
          <div><label className="text-sm text-gray-400 mb-1.5 block">Display Name</label><input value={profile.name} onChange={(e) => setProfile({ name:e.target.value })} className="input-field" /></div>
          <button onClick={() => profileMutation.mutate(profile)} disabled={profileMutation.isPending} className="btn-primary">{profileMutation.isPending?<Loader size={14} className="animate-spin"/>:<CheckCircle size={14}/>}Save</button>
        </div>
      </Section>
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={handlePwdSubmit} className="space-y-4">
          {['currentPassword','newPassword','confirm'].map((field, i) => (
            <div key={field}><label className="text-sm text-gray-400 mb-1.5 block">{['Current','New','Confirm New'][i]} Password</label><input type="password" value={passwords[field]} onChange={(e) => setPasswords({...passwords,[field]:e.target.value})} className="input-field" placeholder="••••••••" required /></div>
          ))}
          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">{passwordMutation.isPending?<Loader size={14} className="animate-spin"/>:<Lock size={14}/>}Change Password</button>
        </form>
      </Section>
      <Section title="Knowledge Base (RAG)" icon={Brain}>
        <p className="text-sm text-gray-400 mb-4">Upload documents to give agents domain-specific knowledge.</p>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all mb-4">
          <Upload size={24} className="text-gray-500 mb-2" /><p className="text-sm text-gray-400">Click to upload</p><p className="text-xs text-gray-600 mt-1">PDF, TXT, MD · Max 10MB</p>
          <input type="file" accept=".pdf,.txt,.md,.json" className="hidden" onChange={(e) => { if(e.target.files[0]) uploadMutation.mutate(e.target.files[0]); e.target.value=''; }} disabled={uploadMutation.isPending} />
        </label>
        {uploadMutation.isPending && <div className="flex items-center gap-2 text-sm text-brand-400 mb-4"><Loader size={14} className="animate-spin"/>Uploading...</div>}
        <div className="space-y-2">
          {docsLoading ? <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"/></div>
          : docsData?.length ? docsData.map(doc => (
            <div key={doc._id} className="flex items-center gap-3 glass rounded-xl p-3">
              <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center"><FileText size={14} className="text-brand-400"/></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{doc.originalName}</p><div className="flex items-center gap-2 text-xs text-gray-500"><span>{(doc.size/1024).toFixed(1)} KB</span>·<span className={clsx(doc.status==='ready'?'text-green-400':doc.status==='failed'?'text-red-400':'text-yellow-400')}>{doc.status}</span>·<span>{format(new Date(doc.createdAt),'MMM d')}</span></div></div>
              <button onClick={() => deleteMutation.mutate(doc._id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded hover:bg-red-500/10"><X size={14}/></button>
            </div>
          )) : <p className="text-center text-gray-600 text-sm py-4">No documents uploaded yet</p>}
        </div>
      </Section>
      <Section title="Account Stats" icon={CheckCircle}>
        <div className="grid grid-cols-3 gap-4">{[['Total Tasks',user?.stats?.totalTasks||0],['Completed',user?.stats?.completedTasks||0],['Tokens',(user?.stats?.totalTokensUsed||0).toLocaleString()]].map(([label,value]) => (<div key={label} className="glass rounded-xl p-4 text-center"><p className="text-2xl font-bold text-white">{value}</p><p className="text-xs text-gray-400 mt-1">{label}</p></div>))}</div>
      </Section>
    </div>
  );
}
