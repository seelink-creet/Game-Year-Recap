import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogIn, ArrowRight, Mail, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
  currentUser?: string | null;
  initialView?: 'login' | 'register' | 'change_password';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, currentUser, initialView = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'change_password'>(initialView);
  
  // Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState(''); // For change password
  
  // UI States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialView);
      setError(null);
      setSuccess(null);
      setUsername(currentUser || '');
      setEmail('');
      setPassword('');
      setNewPassword('');
    }
  }, [isOpen, initialView, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        // For Supabase, we log in with Email (or username if we implement lookup logic)
        // Here we assume username field might be email
        const loginId = email || username; 
        // Small fix: UI shows "Username" field but Supabase expects Email by default.
        // If you want username login, you need a server function to lookup email.
        // For this demo, let's treat the "Username" field as "Email/Username" input.
        
        const res = await authService.login(loginId, password);
        if (res.success && res.user) {
          onLogin(res.user.username);
          onClose();
        } else {
          setError(res.message);
        }
      } 
      else if (mode === 'register') {
        if (!email.includes('@')) {
           setError("Please enter a valid email address.");
           setIsLoading(false);
           return;
        }
        const res = await authService.register(username, email, password);
        if (res.success) {
          setSuccess("Account created! Please check your email to verify (if enabled) or Login.");
          // Auto switch to login after short delay if confirmed
          setTimeout(() => {
             setMode('login');
             setSuccess(null);
             // Pre-fill
             setUsername(email);
          }, 2000);
        } else {
          setError(res.message);
        }
      }
      else if (mode === 'forgot') {
        const res = await authService.resetPasswordRequest(email);
        if (res.success) {
          setSuccess(res.message);
        } else {
          setError(res.message);
        }
      }
      else if (mode === 'change_password') {
        if (!currentUser) {
            setError("You must be logged in.");
            setIsLoading(false);
            return;
        }
        const res = await authService.changePassword(newPassword);
        if (res.success) {
           setSuccess("Password updated successfully.");
           setTimeout(() => onClose(), 1500);
        } else {
           setError(res.message);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderTitle = () => {
    switch(mode) {
        case 'login': return 'Welcome Back';
        case 'register': return 'Create Account';
        case 'forgot': return 'Recover Password';
        case 'change_password': return 'Change Password';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-lg 
                ${mode === 'forgot' ? 'bg-pink-600 shadow-pink-500/30' : 
                  mode === 'change_password' ? 'bg-emerald-600 shadow-emerald-500/30' : 
                  'bg-indigo-600 shadow-indigo-500/30'}`}
            >
                {mode === 'forgot' ? <KeyRound size={28} className="text-white" /> : 
                 mode === 'change_password' ? <Lock size={28} className="text-white" /> :
                 <User size={28} className="text-white" />}
            </div>
            <h2 className="text-2xl font-bold text-white">{renderTitle()}</h2>
            <p className="text-slate-400 text-xs mt-2 text-center max-w-[240px]">
                {mode === 'login' && 'Sync your game collection across devices.'}
                {mode === 'register' && 'Start your journey and track your gaming year.'}
                {mode === 'forgot' && 'Enter your email to retrieve your password.'}
                {mode === 'change_password' && 'Update your security credentials.'}
            </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode='wait'>
            {error && (
                <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                </motion.div>
            )}
            {success && (
                <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                    <CheckCircle2 size={14} /> {success}
                </motion.div>
            )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Username/Email Field for Login/Register */}
            {mode === 'register' && (
                 <div className="relative">
                    <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username (Display Name)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* Email Field - Used for Login, Register and Forgot */}
            {mode !== 'change_password' && (
                <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={isLoading}
                        autoFocus={mode === 'login' || mode === 'forgot'}
                    />
                </div>
            )}

            {/* Password Field */}
            {(mode === 'login' || mode === 'register') && (
                <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* New Password Field - Only for Change Password */}
            {mode === 'change_password' && (
                <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-3.5 text-slate-500" />
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={isLoading}
                    />
                </div>
            )}
            
            <button 
                type="submit"
                disabled={isLoading}
                className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${mode === 'forgot' ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-900/20' : 
                      mode === 'change_password' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' :
                      'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'
                    }`}
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        {mode === 'login' && 'Log In'}
                        {mode === 'register' && 'Sign Up'}
                        {mode === 'forgot' && 'Send Recovery Link'}
                        {mode === 'change_password' && 'Update Password'}
                        <ArrowRight size={16} />
                    </>
                )}
            </button>
        </form>

        {/* Footer Links */}
        {mode !== 'change_password' && (
            <div className="mt-6 text-center text-xs space-y-2">
                {mode === 'login' && (
                    <>
                        <div className="text-slate-500">
                            Don't have an account?{' '}
                            <button onClick={() => setMode('register')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign Up</button>
                        </div>
                         <button onClick={() => setMode('forgot')} className="text-slate-500 hover:text-slate-400 underline transition-colors">Forgot Password?</button>
                    </>
                )}

                {mode === 'register' && (
                    <div className="text-slate-500">
                        Already have an account?{' '}
                        <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Log In</button>
                    </div>
                )}

                {mode === 'forgot' && (
                    <div className="text-slate-500">
                        Remember your password?{' '}
                        <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Back to Login</button>
                    </div>
                )}
            </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthModal;