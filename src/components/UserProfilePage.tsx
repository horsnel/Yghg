import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Check, Save, Sparkles, LogOut, Tag, Building2, UserCheck, Trash2, 
  Users, Key, Bell, Wifi, Mail, Terminal, Clipboard, Plus, ShieldCheck, Crown, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserProfile, updateUserProfile, auth, getUserDesigns } from '../firebase';
import { signOut } from 'firebase/auth';

const CURATED_AVATARS = [
  { id: 'avatar1', name: 'Minimalist Muse', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 'avatar2', name: 'Tailored Vanguard', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 'avatar3', name: 'Avant-Garde Icon', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 'avatar4', name: 'Sartorial Rebel', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 'avatar5', name: 'Urban Edge', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 'avatar6', name: 'Ethereal Silhouette', url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=150&h=150' }
];

const AVAILABLE_AESTHETICS = [
  'Streetwear',
  'Avant-Garde',
  'Sustainable',
  'Minimalist',
  'Techwear',
  'Contemporary Luxury',
  'Archival Retro',
  'Futuristic Cyberpunk'
];

type SettingTab = 'profile' | 'workspace' | 'developer' | 'notifications';

export function UserProfilePage() {
  const [activeSubTab, setActiveSubTab] = useState<SettingTab>('profile');
  
  // Tab 1: Profile State
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [workplaceType, setWorkplaceType] = useState('');
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState('avatar1');
  
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab 2: Brand Workspace State
  const [workspace, setWorkspace] = useState<any>({ name: "Couture Lab East", plan: "Enterprise Pro", address: "Avenue Montaigne, Paris" });
  const [team, setTeam] = useState<any[]>([]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Designer');

  // Tab 3: Developer API Keys State
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Tab 4: Notifications State
  const [emailDailyDigest, setEmailDailyDigest] = useState(true);
  const [emailInviteAlert, setEmailInviteAlert] = useState(true);
  const [emailSalesAlert, setEmailSalesAlert] = useState(true);
  const [pwaOfflineSync, setPwaOfflineSync] = useState(true);
  const [pwaPushAlerts, setPwaPushAlerts] = useState(false);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  // Load basic details & workspace systems
  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        // Load firebase profile
        const userProf = await getUserProfile();
        const designs = await getUserDesigns();
        
        if (designs) {
          setSavedCount(designs.length);
        }

        if (userProf) {
          setProfile(userProf);
          setFullName(userProf.fullName || '');
          setRole(userProf.role || 'Independent Creator');
          setWorkplaceType(userProf.workplaceType || 'Freelance / Studio');
          setSelectedAesthetics(userProf.aesthetics || []);
          setSelectedAvatarId(userProf.avatarId || 'avatar1');
        } else {
          const user = auth.currentUser;
          setFullName(user?.displayName || 'Couture Designer');
        }

        // Fetch team list from full-stack endpoint
        const teamRes = await fetch('/api/workspace-team');
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setWorkspace(teamData.workspace);
          setTeam(teamData.team);
        }

        // Fetch developer keys from full-stack endpoint
        const keysRes = await fetch('/api/developer-keys');
        if (keysRes.ok) {
          const keysData = await keysRes.json();
          setApiKeys(keysData.keys);
        }

      } catch (err) {
        console.error("Failed to load settings data", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  const handleAestheticToggle = (aes: string) => {
    setSelectedAesthetics(prev => 
      prev.includes(aes) ? prev.filter(t => t !== aes) : [...prev, aes]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      await updateUserProfile({
        fullName,
        role,
        workplaceType,
        aesthetics: selectedAesthetics,
        avatarId: selectedAvatarId
      });
      setSuccessMsg('Profile settings successfully saved to Atelier Vault.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out from Couture AI Atelier?")) {
      try {
        await signOut(auth);
        window.location.reload();
      } catch (err) {
        console.error("Logout failed", err);
      }
    }
  };

  // Team actions
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    try {
      const res = await fetch('/api/workspace-team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole })
      });
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setInviteName('');
        setInviteEmail('');
        setSuccessMsg(`Invited ${inviteName} to the workspace.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    try {
      const res = await fetch('/api/workspace-team/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setSuccessMsg(`Team roster updated successfully.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Developer Keys actions
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/developer-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newKeyDesc || "Standard Client Sourcing Sync" })
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys);
        setNewKeyDesc('');
        setSuccessMsg(`Created live developer credentials.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const res = await fetch('/api/developer-keys/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyKey = (keyText: string, id: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // simulated email dispatches
  const handleSimulateEmail = async () => {
    try {
      setSendingDigest(true);
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: auth.currentUser?.email, templateName: 'daily-trends' })
      });
      if (res.ok) {
        const data = await res.json();
        setEmailPreviewHtml(data.htmlPreview);
        setShowEmailModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingDigest(false);
    }
  };

  const currentAvatarUrl = CURATED_AVATARS.find(a => a.id === selectedAvatarId)?.url || CURATED_AVATARS[0].url;

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/20 h-full">
      <div className="max-w-4xl mx-auto flex flex-col h-full">
        
        {/* Title & Stats Header */}
        <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 dark:border-gray-900 pb-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl mb-1 text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
              <User className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" />
              Atelier Profile & Settings
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-sans text-xs md:text-sm">Manage workspace teams, developer API integrations, and aesthetic parameters.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm max-w-xs self-start md:self-auto">
            <img 
              src={currentAvatarUrl} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-800"
              referrerPolicy="no-referrer"
            />
            <div className="pr-3">
              <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{fullName || 'Atelier Designer'}</div>
              <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-0.5 mt-0.5 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> {workspace.plan}
              </div>
            </div>
          </div>
        </div>

        {/* Setting Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto pb-px shrink-0">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'profile'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" /> Identity & Aesthetics
          </button>
          <button
            onClick={() => setActiveSubTab('workspace')}
            className={`px-4 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'workspace'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" /> Brand Workspace
          </button>
          <button
            onClick={() => setActiveSubTab('developer')}
            className={`px-4 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'developer'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Key className="w-4 h-4" /> Developer Keys
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-4 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'notifications'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications & PWA
          </button>
        </div>

        {/* Global Toast Success / Error Banners */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 mb-6 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 mb-6 shadow-sm dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
            >
              <UserCheck className="w-4 h-4 text-red-600 shrink-0" /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 border-2 border-gray-950 dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[11px] font-mono tracking-widest text-gray-400 uppercase animate-pulse">Retrieving secure preferences...</p>
          </div>
        ) : (
          <div>
            {/* SUB-TAB 1: IDENTITY & DESIGN PREFERENCES */}
            {activeSubTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6 lg:col-span-1">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 mb-4">
                      <img 
                        src={currentAvatarUrl} 
                        alt="Current Avatar" 
                        className="w-full h-full object-cover rounded-full border-2 border-gray-900 dark:border-white shadow"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full p-1.5 shadow">
                        <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                      </div>
                    </div>
                    <h3 className="font-display font-medium text-lg text-gray-900 dark:text-white">{fullName || 'Atelier Designer'}</h3>
                    <p className="text-xs text-gray-400 mb-6">{auth.currentUser?.email}</p>

                    <div className="w-full grid grid-cols-2 gap-4 border-t border-b border-gray-100 dark:border-gray-800 py-4 mb-6">
                      <div>
                        <div className="text-xl font-display font-semibold text-gray-900 dark:text-white">{savedCount}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Saved Designs</div>
                      </div>
                      <div>
                        <div className="text-xl font-display font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <Shield className="w-4 h-4" /> Active
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Vault Access</div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>

                  <div className="bg-gray-900 dark:bg-gray-900/50 text-gray-300 p-6 rounded-2xl border border-gray-800 shadow-sm">
                    <h4 className="font-display font-medium text-sm text-white mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" /> Private Workspace
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Your sketchbooks, custom prompt tokens, and high-res technical vectors are held securely under private client-side encryption.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {/* Curated Avatars */}
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-900 dark:text-white" /> Curated High-Fashion Avatars
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {CURATED_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatarId(av.id)}
                          className={`relative flex flex-col items-center p-1 rounded-xl group transition-all cursor-pointer ${selectedAvatarId === av.id ? 'bg-gray-100 dark:bg-gray-800 shadow-inner' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                        >
                          <div className="relative w-12 h-12 mb-1.5">
                            <img 
                              src={av.url} 
                              alt={av.name} 
                              className={`w-full h-full object-cover rounded-full border-2 transition-transform duration-300 group-hover:scale-105 ${selectedAvatarId === av.id ? 'border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-700'}`}
                              referrerPolicy="no-referrer"
                            />
                            {selectedAvatarId === av.id && (
                              <div className="absolute -bottom-1 -right-1 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 text-center line-clamp-1">{av.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Professional Form */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Professional Identity</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Full Name
                        </label>
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-sm text-gray-900 dark:text-white" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Workplace Type
                        </label>
                        <select
                          value={workplaceType}
                          onChange={(e) => setWorkplaceType(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-sm text-gray-900 dark:text-white"
                        >
                          <option value="Freelance / Studio">Freelance / Studio</option>
                          <option value="Independent Label">Independent Label</option>
                          <option value="Established Fashion House">Established Fashion House</option>
                          <option value="Design Consultancy">Design Consultancy</option>
                          <option value="Academic Institution">Academic Institution</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" /> Designer Role
                      </label>
                      <input 
                        type="text" 
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-sm text-gray-900 dark:text-white" 
                        placeholder="e.g. Lead Designer, Creative Director"
                      />
                    </div>
                  </div>

                  {/* Aesthetics Focus */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Tailored Aesthetics Focus
                    </h3>
                    <p className="text-xs text-gray-400 mb-6">These help calibrate our Trend Intelligence module to suggest optimal prompts.</p>
                    
                    <div className="flex flex-wrap gap-2.5">
                      {AVAILABLE_AESTHETICS.map(aes => {
                        const active = selectedAesthetics.includes(aes);
                        return (
                          <button
                            key={aes}
                            type="button"
                            onClick={() => handleAestheticToggle(aes)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                              active 
                                ? 'bg-gray-900 border-gray-900 text-white shadow dark:bg-white dark:text-gray-900 dark:border-white' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            {active && <Check className="w-3.5 h-3.5" />} {aes}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2.5 disabled:bg-gray-400 cursor-pointer dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      <Save className="w-4 h-4" /> {saving ? 'Saving to Vault...' : 'Save Profile Preferences'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* SUB-TAB 2: BRAND WORKSPACE & TEAM ROSTERS */}
            {activeSubTab === 'workspace' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Workspace overview and subscription details */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500" /> Active Organization
                    </h3>
                    <div className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-1">{workspace.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" /> {workspace.address}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Subscription Tier:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{workspace.plan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Billing Currency:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{workspace.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Team Seat Limits:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">No Hard Cap (Enterprise)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 text-gray-300 p-6 rounded-2xl border border-gray-800 shadow-sm">
                    <h4 className="font-display font-medium text-sm text-white mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Collaborative Synced States
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Invited designers can instantly collaborate on shared collections, export production tech packs, and review global trend forecasting timeline aggregates in real-time.
                    </p>
                  </div>
                </div>

                {/* Team roster & invite tools */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Current Active Team */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-900 dark:text-white" /> Collaborative Team Roster
                    </h3>

                    <div className="space-y-4">
                      {team.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 dark:bg-gray-700 text-white rounded-full flex items-center justify-center font-display font-semibold text-sm">
                              {member.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900 dark:text-white">{member.name}</div>
                              <div className="text-[10px] text-gray-400">{member.email}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">
                              {member.role}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${member.status === 'Active' ? 'text-emerald-600' : 'text-amber-500'}`}>
                              ● {member.status}
                            </span>
                            {member.id !== '1' && (
                              <button 
                                onClick={() => handleDeleteTeamMember(member.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                title="Remove team member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invite New Member */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-gray-900 dark:text-white" /> Invite Custom Designer
                    </h3>

                    <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Full Name</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Jean-Pierre"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg text-xs focus:outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">E-Mail Address</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="jp@brand.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg text-xs focus:outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Studio Role</label>
                        <div className="flex gap-2">
                          <select 
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg text-xs focus:outline-none text-gray-900 dark:text-white"
                          >
                            <option value="Lead Designer">Lead Designer</option>
                            <option value="Patternmaker">Patternmaker</option>
                            <option value="Textile Specialist">Textile Specialist</option>
                            <option value="Accountant">Account Manager</option>
                          </select>
                          <button 
                            type="submit" 
                            className="px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold cursor-pointer dark:bg-white dark:text-gray-900 transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: DEVELOPER PUBLIC API KEYS CONSOLE */}
            {activeSubTab === 'developer' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sourcing details */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-indigo-500" /> Sourcing Integration
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Create live API credentials to pull your private design collection sketches, export technical specs, or trigger generative techpack pipelines from external ERP systems like SAP or custom shopfront solutions.
                    </p>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl text-[10px] text-indigo-800 dark:text-indigo-400 font-medium">
                      All REST requests are fully secured with header authentication tokens.
                    </div>
                  </div>

                  <div className="bg-gray-950 text-gray-300 p-6 rounded-2xl border border-gray-800 shadow-sm font-mono text-[10px] leading-relaxed">
                    <span className="text-emerald-400"># API Endpoint Url:</span>
                    <div className="text-white select-all mt-1 p-2 bg-black/40 rounded border border-white/5 overflow-x-auto">
                      https://couture.ai/api/v1/sourcing
                    </div>
                  </div>
                </div>

                {/* API Key Table & Code snippet */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Keys list */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-900 dark:text-white" /> Production API Credentials
                    </h3>

                    <div className="space-y-4 mb-6">
                      {apiKeys.map((keyObj: any) => (
                        <div key={keyObj.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between">
                          <div className="font-mono">
                            <div className="text-xs font-semibold text-gray-900 dark:text-white select-all">{keyObj.key}</div>
                            <div className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">Created {keyObj.created} — {keyObj.description}</div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => handleCopyKey(keyObj.key, keyObj.id)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy key to clipboard"
                            >
                              {copiedKeyId === keyObj.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                            </button>
                            <button 
                              onClick={() => handleDeleteKey(keyObj.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                              title="Revoke API Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Generate Key */}
                    <form onSubmit={handleGenerateKey} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. ERP Shopify Sync Connection"
                        required
                        value={newKeyDesc}
                        onChange={(e) => setNewKeyDesc(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg text-xs focus:outline-none text-gray-900 dark:text-white"
                      />
                      <button 
                        type="submit" 
                        className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer dark:bg-white dark:text-gray-900 transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Generate Key
                      </button>
                    </form>
                  </div>

                  {/* Code snippet block */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-gray-900 dark:text-white" /> Live API Integration Guide
                    </h3>
                    
                    <div className="bg-gray-950 text-white p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2 border border-gray-800">
                      <div className="text-gray-400"># Query active private collections programmatically:</div>
                      <div className="select-all">
                        <span className="text-indigo-400">curl</span> -X GET \
                        <br />&nbsp;&nbsp;-H <span className="text-emerald-400">"Authorization: Bearer sk_live_atelier_a9b8c..."</span> \
                        <br />&nbsp;&nbsp;https://couture.ai/api/v1/sourcing/designs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: NOTIFICATIONS HUB & PWA OFFLINE CAPABILITIES */}
            {activeSubTab === 'notifications' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side info */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-emerald-500" /> PWA Status Center
                    </h3>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl mb-4">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                        PWA Offline Engine: Online & Cached
                      </div>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1.5">
                        Your app has loaded and cached static assets, components and design drafts in local IndexedDB. You can load this workspace completely offline.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Service Worker state:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">Active (v1.8.2)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Storage Cached:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">12.4 MB (Compressed)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 text-gray-300 p-6 rounded-2xl border border-gray-800 shadow-sm">
                    <h4 className="font-display font-medium text-sm text-white mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-400" /> Sourcing Digests
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      All newsletters and runway reports contain high-fidelity structured specs and copyable designer prompts curated directly for your registered aesthetics.
                    </p>
                  </div>
                </div>

                {/* Right side toggles and email preview simulator */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Notification preference sliders */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-900 dark:text-white" /> Dispatch Preferences
                    </h3>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Daily Intelligence Trend Digests</h4>
                          <p className="text-[10px] text-gray-400">Receive global streetwear trends and viral Milan predictions daily.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={emailDailyDigest}
                          onChange={(e) => setEmailDailyDigest(e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Team Studio Invitations</h4>
                          <p className="text-[10px] text-gray-400">Notify me immediately via email when invited to external label workspaces.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={emailInviteAlert}
                          onChange={(e) => setEmailInviteAlert(e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Marketplace Licensing Notifications</h4>
                          <p className="text-[10px] text-gray-400">Send confirmation alerts when other designers purchase licenses for your tech packs.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={emailSalesAlert}
                          onChange={(e) => setEmailSalesAlert(e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PWA offline and push simulation */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-gray-900 dark:text-white" /> Progressive Web App (PWA) Settings
                    </h3>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Persistent Offline Syncing</h4>
                          <p className="text-[10px] text-gray-400">Enable local SQLite/IndexedDB caching of workspace sketches for offline drafting.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pwaOfflineSync}
                          onChange={(e) => setPwaOfflineSync(e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Live Push Notifications</h4>
                          <p className="text-[10px] text-gray-400">Enable desktop system push notices for collaborative comments or studio updates.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pwaPushAlerts}
                          onChange={(e) => setPwaPushAlerts(e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email dispatch simulator card */}
                  <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-indigo-600" /> Professional Email Simulator
                    </h3>
                    <p className="text-xs text-gray-400 mb-6">Test and view the high-fashion HTML layout compiled dynamically by our server for trend delivery.</p>

                    <button
                      type="button"
                      disabled={sendingDigest}
                      onClick={handleSimulateEmail}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:bg-indigo-400"
                    >
                      <Mail className="w-4 h-4" /> {sendingDigest ? 'Generating template...' : 'Simulate Daily Report Dispatch'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Dynamic Modal for Simulated HTML Email Rendering */}
      <AnimatePresence>
        {showEmailModal && emailPreviewHtml && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                  <Mail className="w-4 h-4" /> Inbox Simulator Preview
                </div>
                <button 
                  onClick={() => setShowEmailModal(false)}
                  className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-xs font-mono">
                <div className="text-gray-400">To: <span className="text-gray-900 font-semibold">{auth.currentUser?.email}</span></div>
                <div className="text-gray-400 mt-1">Subject: <span className="text-gray-900 font-semibold">Atelier Daily Intelligence Sourcing Digest</span></div>
              </div>

              <div 
                className="border border-gray-200 rounded-xl overflow-hidden p-1 shadow-inner bg-gray-50 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
              />

              <div className="mt-6 flex justify-end gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mr-auto">
                  <Info className="w-3.5 h-3.5" /> Simulated SMTP Success
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
