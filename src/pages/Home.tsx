import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DraftingCompass, Target, Rocket, ArrowRight, X } from 'lucide-react';
import { auth, googleProvider, registerLead, syncGoogleLead, signInUser } from '../services/firebase';
import { signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const fadeInSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Navbar = ({ onAuthClick }: { onAuthClick: (mode: 'signup' | 'signin') => void }) => {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-16 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900"
    >
      <div className="flex items-center gap-6">
        <span className="text-[20px] font-extrabold tracking-[-0.5px] text-white">WebZinc</span>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onAuthClick('signin')} 
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <motion.button 
            onClick={() => onAuthClick('signup')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-[18px] py-1.5 text-[13px] font-semibold text-black bg-white rounded-md hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all"
          >
            Sign Up
          </motion.button>
        </div>
      </div>
      
      <div className="hidden md:flex items-center space-x-8 text-[13px] font-medium text-white">
        <a href="#platform" className="text-white underline underline-offset-8 decoration-2 transition-colors">Platform</a>
        <a href="#case-studies" className="text-white transition-colors">Case Studies</a>
        <a href="#pricing" className="text-white transition-colors">Pricing</a>
        <a href="#contact" className="text-white transition-colors">Contact</a>
      </div>
    </motion.nav>
  );
};

const AuthModal = ({ isOpen, onClose, initialMode = 'signup' }: { isOpen: boolean, onClose: () => void, initialMode?: 'signup' | 'signin' }) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [niche, setNiche] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Reset to initial mode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setError(null);
    }
  }, [isOpen, initialMode]);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Trim to prevent hidden character/space issues causing invalid-credential
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      if (isSignUp) {
        await registerLead(cleanEmail, cleanPassword, businessName, niche);
      } else {
        await signInUser(cleanEmail, cleanPassword);
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setBusinessName('');
        setEmail('');
        setPassword('');
        setNiche('');
        navigate('/profile');
      }, 1500);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
         setError('This email is already registered. Please log in.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
         if (!isSignUp) {
             setError("Account not found or invalid credentials. If you are new, please create an account first.");
         } else {
             setError('Invalid credentials. Please try again.');
         }
      } else {
         setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Set persistence lock strictly right before redirect to ensure hand-off preserves 
      // cookie context strictly against Vercel's Edge node networking
      await setPersistence(auth, browserLocalPersistence);

      // Using redirect for Vercel/mobile stability instead of popup
      await signInWithRedirect(auth, googleProvider);
      // Redirects will unload the page, so no state resets here
    } catch (err: any) {
      console.error("FULL GOOGLE AUTH ERROR OBJECT:", err);
      alert(`[Developer Overlay - Google Sign In]\nCode: ${err.code}\nMessage: ${err.message}`);
      
      setError(err.message || 'An error occurred with Google Sign In.');
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Content - Slides Out Smoothly on Exit */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col mt-auto sm:mt-0 overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div 
                  key={`form-${isSignUp ? 'signup' : 'signin'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col"
                >
                  <h2 className="text-2xl font-bold text-white mb-6 pr-8 w-full text-center sm:text-left">
                    {isSignUp ? "Join the Zinc Infrastructure" : "Welcome Back to WebZinc"}
                  </h2>

                  {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-[13px]">
                      {error}
                    </div>
                  )}

                  <motion.button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full bg-white text-black text-[14px] font-bold py-3 rounded-md hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3 mb-6"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    Continue with Google
                  </motion.button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                      {isSignUp ? "or sign up manually" : "or continue with email"}
                    </span>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {isSignUp && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Business Name</label>
                        <input 
                          type="text" 
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="bg-white/5 border border-white/10 text-white rounded-md px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors"
                          placeholder="Apex Dental"
                        />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Email</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-md px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors"
                        placeholder="founder@company.com"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white rounded-md px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors"
                        placeholder="••••••••"
                      />
                    </div>

                    {isSignUp && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Niche</label>
                        <input 
                          type="text" 
                          required
                          value={niche}
                          onChange={(e) => setNiche(e.target.value)}
                          className="bg-white/5 border border-white/10 text-white rounded-md px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors"
                          placeholder="e.g. Healthcare, Hospitality..."
                        />
                      </div>
                    )}

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="mt-4 w-full bg-cyan-400 text-cyan-950 text-[15px] font-bold py-3.5 rounded-md hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-70 disabled:hover:shadow-none transition-all flex items-center justify-center"
                    >
                      {isLoading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                    </motion.button>

                    <p className="text-center text-[12px] text-zinc-400 mt-2">
                      {isSignUp ? (
                        <>Already have an account? <button type="button" onClick={toggleMode} className="text-cyan-400 hover:underline">Sign In</button></>
                      ) : (
                        <>New to WebZinc? <button type="button" onClick={toggleMode} className="text-cyan-400 hover:underline">Create an account</button></>
                      )}
                    </p>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 bg-cyan-400/20 rounded-full flex items-center justify-center mb-6">
                    <Rocket className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Welcome {isSignUp ? "to the Network" : "Back"}</h3>
                  <p className="text-zinc-400 text-[14px]">Initializing your digital infrastructure...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Hero = () => {
  return (
    <section className="relative px-12 py-12 max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-10 mt-16 pb-12 h-auto">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full point-events-none" />

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-start z-10"
      >
        <motion.div variants={fadeInSlideUp} className="flex gap-2 mb-4">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full">Architecture</span>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full">Marketing Infusion</span>
        </motion.div>
        
        <motion.h1 variants={fadeInSlideUp} className="text-[48px] md:text-[64px] font-extrabold leading-[1.1] tracking-[-1px] text-white mb-4">
          Dominate Your<br/>Local <span className="text-cyan-400">Market</span>
        </motion.h1>
        
        <motion.p variants={fadeInSlideUp} className="text-[14px] text-zinc-400 mb-6 max-w-md leading-relaxed">
          We don't just build websites. We engineer high-performance digital infrastructure designed to systematically capture leads and scale your business operations.
        </motion.p>
        
        <motion.div variants={fadeInSlideUp} className="flex flex-col sm:flex-row items-center gap-3">
          <button className="px-[18px] py-1.5 text-[13px] font-bold text-black bg-white rounded-md hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Ignite Growth
          </button>
          <button className="px-[18px] py-1.5 text-[13px] font-semibold text-white bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors backdrop-blur-sm">
            View Methodology
          </button>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 w-full flex justify-center lg:justify-end z-10 relative"
      >
        {/* Placeholder for 3D glowing cube */}
        <div className="relative w-full max-w-[400px] aspect-square group">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-2xl animate-pulse blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="absolute inset-[2px] bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shadow-[inset_0_0_40px_rgba(34,211,238,0.1)]">
             <img src="https://picsum.photos/seed/cyber/600/600" alt="Cyber abstract" className="w-full h-full object-cover opacity-50 mix-blend-luminosity" referrerPolicy="no-referrer" />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

const ProcessCard = ({ icon: Icon, title, desc, delay }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="p-5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 transition-all group"
    >
      <div className="w-10 h-10 rounded-md bg-zinc-950 flex items-center justify-center mb-4 border border-zinc-800 group-hover:border-cyan-500/50 transition-colors">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <h3 className="text-[16px] font-bold text-white mb-1.5">{title}</h3>
      <p className="text-[13px] text-zinc-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

const ProcessSection = () => {
  return (
    <section id="platform" className="w-full">
      <div className="mb-8">
        <h2 className="text-[28px] font-extrabold tracking-tight text-white mb-2">The Luminescent Process</h2>
        <p className="text-[14px] text-zinc-400">A systematic approach to digital dominance.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pt-4">
        <ProcessCard 
          icon={DraftingCompass} 
          title="1. Architectural Audit" 
          desc="We dissect your current digital presence, identifying structural weaknesses and untapped performance vectors."
          delay={0.1}
        />
        <div className="md:mt-8">
          <ProcessCard 
            icon={Target} 
            title="2. Precision Build" 
            desc="Engineering a high-conversion infrastructure optimized for speed, aesthetics, and localized search visibility."
            delay={0.2}
          />
        </div>
        <ProcessCard 
          icon={Rocket} 
          title="3. Market Saturation" 
          desc="Deploying targeted infusion protocols to capture lead flow and establish undeniable authority."
          delay={0.3}
        />
      </div>
    </section>
  )
}

const CaseStudyCard = ({ title, category, imgSeed }: any) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="group relative w-full h-[120px] rounded-lg overflow-hidden cursor-pointer"
    >
      <img 
        src={`https://picsum.photos/seed/${imgSeed}/600/400?blur=2`} 
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4">
        <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{category}</p>
        <div className="flex items-center gap-2">
          <h3 className="text-white text-[16px] font-bold">{title}</h3>
          <ArrowRight className="w-4 h-4 text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}

const CaseStudiesSection = () => {
  return (
    <section id="case-studies" className="w-full mt-10 lg:mt-0">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-[28px] font-extrabold tracking-tight text-white mb-2">Structural Case Studies</h2>
        <a href="#" className="text-cyan-400 text-[12px] font-semibold hover:text-cyan-300 transition-colors flex items-center gap-1 mb-2">
          View All Projects <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CaseStudyCard title="Apex Dental Clinic" category="Healthcare" imgSeed="dental" />
        <CaseStudyCard title="Roast & Co." category="Hospitality" imgSeed="coffee" />
        <CaseStudyCard title="Nimbus Tech" category="SaaS" imgSeed="tech" />
        <CaseStudyCard title="Elevate Fitness" category="Wellness" imgSeed="fitness" />
      </div>
    </section>
  )
}

const Footer = () => {
  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950 mt-12">
      <div className="max-w-[1280px] mx-auto px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-zinc-500">
          <span className="font-bold text-white text-[14px]">WebZinc</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-[12px] font-medium text-zinc-400">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [isRedirectLoading, setIsRedirectLoading] = useState(true);
  
  const navigate = useNavigate();
  const { currentUser, loading: authContextLoading } = useAuth();

  useEffect(() => {
    // Check for returning users from the Google redirect handshake
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("GOOGLE LOGIN SUCCESS");
          // If we caught a result from Google, ensure the DB is perfectly synced
          await syncGoogleLead(result.user);
          // Navigate is explicitly called here after a proven redirect
          navigate('/profile', { replace: true });
        }
      } catch (err: any) {
        console.error("AUTHENTICATION REDIRECT ERROR:", err);
        alert(`[Developer Overlay - Redirect Error]\nCode: ${err.code}\nMessage: ${err.message}`);
      } finally {
        setIsRedirectLoading(false);
      }
    };
    checkRedirectResult();
  }, [navigate]);

  useEffect(() => {
    // Once redirect checks are done, if the user was already signed in from a past session, send them to profile
    if (!isRedirectLoading && !authContextLoading && currentUser) {
      navigate('/profile', { replace: true });
    }
  }, [isRedirectLoading, authContextLoading, currentUser, navigate]);

  const handleOpenAuth = (mode: 'signup' | 'signin') => {
    setAuthMode(mode);
    setIsModalOpen(true);
  };

  // Show premium loading spinner while evaluating auth state or redirect results
  if (isRedirectLoading || authContextLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 font-semibold uppercase tracking-wider text-[11px] animate-pulse">
          Verifying your Google Account...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden font-sans text-[14px] flex flex-col">
      <Navbar onAuthClick={handleOpenAuth} />
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialMode={authMode} />
      <main className="flex-1">
        <Hero />
        <section className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 px-12 pb-12">
          <ProcessSection />
          <CaseStudiesSection />
        </section>
      </main>
      <Footer />
    </div>
  );
}
