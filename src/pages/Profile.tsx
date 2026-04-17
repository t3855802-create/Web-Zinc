import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogOut, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, logoutUser } from '../services/firebase';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      const data = await getUserProfile(currentUser.uid);
      if (data) {
        setBusinessName(data.businessName || '');
        setNiche(data.niche || '');
      }
    };

    fetchProfile();
  }, [currentUser, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setSuccessMsg('');
    await updateUserProfile(currentUser.uid, { businessName, niche });
    setIsSaving(false);
    setSuccessMsg('Profile updated securely.');
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  if (!currentUser) return null; // Wait for redirect

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans text-[14px]">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 md:px-12 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900 sticky top-0 z-50">
        <span className="text-[20px] font-extrabold tracking-[-0.5px] cursor-pointer" onClick={() => navigate('/')}>
          WebZinc
        </span>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-[13px] font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 md:p-10 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-zinc-800/50">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden flex-shrink-0">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-2xl">
                    {currentUser.email?.[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold">{currentUser.displayName || 'System Admin'}</h1>
                <p className="text-zinc-400 text-[13px]">{currentUser.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 rounded-full text-[12px] font-semibold tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              FREE TIER
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Business Name</label>
                <input 
                  type="text" 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-zinc-950/50 border border-zinc-800 text-white rounded-md px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:bg-zinc-950 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Industry Niche</label>
                <input 
                  type="text" 
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-zinc-950/50 border border-zinc-800 text-white rounded-md px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:bg-zinc-950 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              {successMsg ? (
                <span className="text-cyan-400 text-[13px] font-medium animate-pulse">{successMsg}</span>
              ) : (
                <span />
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[13px] font-bold rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
