import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Sprout, 
  ArrowRight, Loader2, CheckCircle, AlertTriangle, Leaf, Chrome 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

// --- Schemas ---
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, { message: "Valid phone number required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  farmLocation: z.string().min(3, { message: "Location is required" }),
  cropsGrown: z.string().min(2, { message: "List at least one crop" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function Login() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forms
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false }
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      fullName: '', email: '', phone: '', password: '', 
      farmLocation: '', cropsGrown: '' 
    }
  });

  const forgotForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  // --- Handlers ---

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const onLoginSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { error } = await auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      toast.success("Welcome back, Farmer!");
      // Use requestAnimationFrame to prevent iframe port destruction
      requestAnimationFrame(() => {
        navigate('/', { replace: true });
      });
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      toast.success("Account created! Check your email to confirm.");
      setView('login');
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const onForgotSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent!");
      setView('login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F2] flex items-center justify-center p-4 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-green-100/50 to-transparent" />
        <Leaf className="absolute top-10 left-10 text-green-200 w-32 h-32 rotate-[-15deg] opacity-20" />
        <Sprout className="absolute bottom-10 right-10 text-green-200 w-40 h-40 rotate-[15deg] opacity-20" />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-[480px] rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-green-100"
      >
        {/* Header Section */}
        <div className="bg-green-700 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg rotate-3"
            >
              <Sprout className="w-10 h-10 text-green-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight">FarmVision</h1>
            <p className="text-green-100 mt-1 font-medium">Cultivating Success Together</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          
          {/* Tabs */}
          {view !== 'forgot' && (
            <div className="flex bg-green-50 p-1 rounded-xl mb-8 relative">
              <motion.div 
                layoutId="tab-highlight"
                className={`absolute top-1 bottom-1 ${view === 'login' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+4px)] w-[calc(50%-8px)]'} bg-white rounded-lg shadow-sm`}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setView('login')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-bold text-center transition-colors ${view === 'login' ? 'text-green-800' : 'text-green-600/70 hover:text-green-700'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setView('signup')}
                className={`flex-1 relative z-10 py-2.5 text-sm font-bold text-center transition-colors ${view === 'signup' ? 'text-green-800' : 'text-green-600/70 hover:text-green-700'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Forms Container */}
          <AnimatePresence mode="wait">
            
            {/* LOGIN FORM */}
            {view === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      {...loginForm.register('email')}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl outline-none transition-all font-medium text-gray-800"
                      placeholder="farmer@example.com"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs ml-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...loginForm.register('password')}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl outline-none transition-all font-medium text-gray-800"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-green-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs ml-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox"
                        {...loginForm.register('rememberMe')}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-green-500 checked:bg-green-500 transition-all"
                      />
                      <CheckCircle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium group-hover:text-green-700">Remember me</span>
                  </label>
                  
                  <button 
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm font-bold text-orange-500 hover:text-orange-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                </button>
              </motion.form>
            )}

            {/* SIGNUP FORM */}
            {view === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input {...signupForm.register('fullName')} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl text-sm outline-none font-medium" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 ml-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input {...signupForm.register('phone')} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl text-sm outline-none font-medium" placeholder="+91 9876543210" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input {...signupForm.register('email')} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl text-sm outline-none font-medium" placeholder="farmer@example.com" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="password" {...signupForm.register('password')} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl text-sm outline-none font-medium" placeholder="Min 8 chars" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">Farm Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input {...signupForm.register('farmLocation')} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl text-sm outline-none font-medium" placeholder="Village, District" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">Crops Grown</label>
                  <div className="relative">
                    <Sprout className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input {...signupForm.register('cropsGrown')} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl text-sm outline-none font-medium" placeholder="Rice, Wheat, Maize (comma separated)" />
                  </div>
                </div>

                {/* Show first error only to save space */}
                {Object.keys(signupForm.formState.errors).length > 0 && (
                   <p className="text-red-500 text-xs text-center font-medium">
                     {Object.values(signupForm.formState.errors)[0]?.message}
                   </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </button>
              </motion.form>
            )}

            {/* FORGOT PASSWORD */}
            {view === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <div className="text-center">
                   <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                     <AlertTriangle className="w-6 h-6 text-orange-500" />
                   </div>
                   <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                   <p className="text-sm text-gray-500 mt-1">Enter your email to receive reset instructions</p>
                </div>

                <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        {...forgotForm.register('email')}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-green-500 rounded-xl outline-none transition-all font-medium"
                        placeholder="farmer@example.com"
                      />
                    </div>
                    {forgotForm.formState.errors.email && (
                      <p className="text-red-500 text-xs ml-1">{forgotForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                  </button>
                </form>

                <button 
                  onClick={() => setView('login')}
                  className="w-full py-2 text-sm font-bold text-gray-500 hover:text-green-600 transition-colors"
                >
                  Back to Login
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Social Login Divider */}
          {view === 'login' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-gray-400 font-medium">Or continue with</span></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full border-2 border-gray-100 hover:border-gray-200 bg-white text-gray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Chrome className="w-5 h-5 text-blue-500" />
                    <span>Google Account</span>
                  </>
                )}
              </button>
            </>
          )}

        </div>
        
        {/* Footer Accent */}
        <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600" />
      </motion.div>

      {/* Footer Text */}
      <div className="fixed bottom-4 text-center w-full text-xs text-green-800/40 font-medium pointer-events-none">
        &copy; 2026 FarmVision Agriculture Systems. Secure & Encrypted.
      </div>
    </div>
  );
}