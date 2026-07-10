import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, CheckCircle2, User, Building, Briefcase, X } from 'lucide-react';
import { TabType } from '../types';
import { auth, createUserProfile, updateUserProfileOnboarding } from '../firebase';
import { sanitizeInput } from '../utils/security';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';

interface AuthPageProps {
  setActiveTab: (tab: TabType) => void;
  onFinish?: () => void;
}

export function Login({ setActiveTab, onFinish }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onFinish) onFinish();
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to log in. Please check your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errMsg = "Invalid email or password. Please verify your credentials and try again.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "The email address is badly formatted.";
      } else if (err.code === "auth/too-many-requests") {
        errMsg = "Too many failed attempts. This account has been temporarily disabled. Please reset your password or try again later.";
      } else if (err?.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true);
    } catch (err: any) {
      console.error(err);
      setForgotError(err.message || "Failed to send reset link.");
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 h-full overflow-y-auto w-full relative">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Enter your credentials to access your atelier.</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                  placeholder="designer@couture.ai" 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Password</label>
                <button 
                  type="button" 
                  onClick={() => { setShowForgot(true); setForgotSent(false); setForgotError(null); }} 
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                  placeholder="••••••••" 
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 italic">
                * Enter your registered email and password to log in.
              </p>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4 disabled:bg-gray-400"
            >
              {loading ? "Signing In..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account? <button onClick={() => setActiveTab('signup')} className="font-semibold text-gray-900 hover:underline">Sign up</button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-gray-100 relative"
            >
              <button 
                type="button" 
                onClick={() => setShowForgot(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-display font-semibold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-gray-500 text-xs mb-5">Enter your email and we'll send a password recovery link.</p>
              
              {forgotError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl">
                  {forgotError}
                </div>
              )}

              {forgotSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">Recovery email sent!</p>
                  <p className="text-xs text-gray-500 mt-1">Please check your inbox at {forgotEmail}.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" 
                      placeholder="designer@couture.ai" 
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-xs transition-colors">
                    Send Reset Link
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Signup({ setActiveTab }: AuthPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const sanitizedName = sanitizeInput(fullName);
    try {
      // 1. Create User in Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);
      // 2. Create User Profile Document in Firestore
      await createUserProfile(sanitizedName, email);
      // 3. Move to email-verified onboarding screen
      setActiveTab('email-verified');
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to create an account.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email address is already in use by another account.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "The password is too weak. Please choose a stronger password.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "The email address is badly formatted.";
      } else if (err?.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 h-full overflow-y-auto w-full">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 my-8">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500 text-sm">Join Couture AI to access generative fashion tools.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium"
            >
              {error}
            </motion.div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                  placeholder="Jane Doe" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                  placeholder="designer@couture.ai" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                  placeholder="Create a strong password" 
                />
              </div>
              
              {password && (
                <div className="mt-2.5">
                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold uppercase">
                    <span className="text-gray-400">Password Strength</span>
                    <span className={strength.label === 'Strong' ? 'text-green-600' : strength.label === 'Medium' ? 'text-amber-600' : 'text-red-600'}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300`} 
                      style={{ width: `${(strength.score / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-2 text-xs text-gray-500 leading-relaxed">
              By creating an account, you agree to our <button type="button" onClick={() => setActiveTab('legal')} className="text-gray-900 font-medium hover:underline">Terms of Service</button> and <button type="button" onClick={() => setActiveTab('legal')} className="text-gray-900 font-medium hover:underline">Privacy Policy</button>.
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4 disabled:bg-gray-400"
            >
              {loading ? "Creating Account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            Already have an account? <button onClick={() => setActiveTab('login')} className="font-semibold text-gray-900 hover:underline">Log in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailVerified({ setActiveTab }: AuthPageProps) {
  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 h-full overflow-y-auto w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 text-center p-10"
      >
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-display font-semibold text-gray-900 mb-3">Email Verified!</h2>
        <p className="text-gray-500 mb-8 leading-relaxed text-sm">
          Your account has been successfully verified. Let's customize your Couture AI experience before you dive into the studio.
        </p>
        <button 
          onClick={() => setActiveTab('onboarding')}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          Continue Setup <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

export function Onboarding({ setActiveTab, onFinish }: AuthPageProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [workplaceType, setWorkplaceType] = useState('');
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const toggleAesthetic = (style: string) => {
    setSelectedAesthetics(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    const sanitizedRole = sanitizeInput(role);
    const sanitizedWorkplace = sanitizeInput(workplaceType);
    const sanitizedAesthetics = selectedAesthetics.map(a => sanitizeInput(a));
    try {
      await updateUserProfileOnboarding(sanitizedRole, sanitizedWorkplace, sanitizedAesthetics);
    } catch (err) {
      console.error("Failed to save onboarding selection to Firebase:", err);
    } finally {
      setLoading(false);
      if (onFinish) onFinish();
    }
  };
  
  return (
    <div className="flex-1 bg-gray-50 flex flex-col p-6 h-full overflow-y-auto w-full">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center py-10">
        
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className={`h-2 rounded-full flex-1 ${step >= 1 ? 'bg-gray-900' : 'bg-gray-200'}`} />
          <div className={`h-2 rounded-full flex-1 ${step >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`} />
          <div className={`h-2 rounded-full flex-1 ${step >= 3 ? 'bg-gray-900' : 'bg-gray-200'}`} />
        </div>
        
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">How do you describe your role?</h2>
              <p className="text-gray-500 mb-8">This helps us tailor your workspace and AI models.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {['Independent Designer', 'Creative Director', 'Fashion Student', 'Brand Owner', 'Pattern Maker', 'Other'].map(roleOption => (
                  <button 
                    key={roleOption} 
                    type="button"
                    onClick={() => { setRole(roleOption); setStep(2); }} 
                    className={`p-4 border text-left rounded-2xl transition-colors font-medium text-gray-800 ${
                      role === roleOption 
                        ? 'border-gray-900 bg-gray-950 text-white shadow-md' 
                        : 'border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {roleOption}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">Where do you work?</h2>
              <p className="text-gray-500 mb-8">Tell us a bit about your organization.</p>
              
              <div className="space-y-4">
                <button 
                  type="button"
                  onClick={() => { setWorkplaceType('Freelance / Solo'); setStep(3); }} 
                  className={`w-full p-5 border rounded-2xl transition-colors flex items-center gap-4 text-left ${
                    workplaceType === 'Freelance / Solo' 
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900' 
                      : 'border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Freelance / Solo</h3>
                    <p className="text-sm text-gray-500">I work independently</p>
                  </div>
                </button>
                <button 
                  type="button"
                  onClick={() => { setWorkplaceType('Agency / Studio'); setStep(3); }} 
                  className={`w-full p-5 border rounded-2xl transition-colors flex items-center gap-4 text-left ${
                    workplaceType === 'Agency / Studio' 
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900' 
                      : 'border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Agency / Studio</h3>
                    <p className="text-sm text-gray-500">Small to medium creative team</p>
                  </div>
                </button>
                <button 
                  type="button"
                  onClick={() => { setWorkplaceType('Enterprise Brand'); setStep(3); }} 
                  className={`w-full p-5 border rounded-2xl transition-colors flex items-center gap-4 text-left ${
                    workplaceType === 'Enterprise Brand' 
                      ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900' 
                      : 'border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Enterprise Brand</h3>
                    <p className="text-sm text-gray-500">Large established fashion house</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-display font-semibold text-gray-900 mb-2">What is your primary aesthetic?</h2>
              <p className="text-gray-500 mb-8">We'll pre-load your moodboard with these influences.</p>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {['Minimalist', 'Avant-Garde', 'Streetwear', 'Bohemian', 'Gothic', 'Sustainable', 'Techwear', 'Vintage', 'Athleisure'].map(style => {
                  const isChecked = selectedAesthetics.includes(style);
                  return (
                    <button 
                      key={style} 
                      type="button"
                      onClick={() => toggleAesthetic(style)}
                      className={`p-3 text-center text-sm font-medium border rounded-xl transition-all ${
                        isChecked 
                          ? 'border-gray-900 bg-gray-900 text-white shadow-md' 
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={handleFinish}
                disabled={loading}
                className="w-full py-4 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {loading ? "Finalizing Workspace..." : "Go to Studio"} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
