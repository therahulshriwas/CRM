// frontend/src/pages/Login.jsx
// Cinematic login: perspective cyber grid floor, aurora orbs, floating glass panel with
// gradient top beam, staggered entrance and magnetic gradient CTA.
// Used in: Application routing root (/login).

import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { validateEmail, validatePassword } from '../utils/validation';
import { easeOutExpo } from '../animations/variants';

function Login() {
  const { login, loading, error: authError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});

  // Already signed in users are sent straight to the command deck.
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempErrors = {};
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    if (emailError) tempErrors.email = emailError;
    if (passwordError) tempErrors.password = passwordError;

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const result = await login(formData.email, formData.password, remember);
    if (result.success) {
      navigate('/app');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen w-full flex items-center justify-center bg-bg-base overflow-hidden px-4"
    >
      {/* Cinematic backdrop */}
      <div className="cyber-grid" />
      <div className="scanlines" />
      <div className="absolute top-[15%] left-[15%] w-[380px] h-[380px] rounded-full bg-accent-primary opacity-[0.12] blur-[110px] pointer-events-none float-bob" />
      <div className="absolute bottom-[15%] right-[15%] w-[380px] h-[380px] rounded-full bg-accent-highlight opacity-[0.12] blur-[110px] pointer-events-none float-bob-delay" />
      <div className="absolute top-[45%] left-[55%] w-[300px] h-[300px] rounded-full bg-info opacity-[0.08] blur-[110px] pointer-events-none" />

      {/* Floating glass panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="relative w-full max-w-[420px] rounded-2xl glass-deep p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] z-10 select-none overflow-hidden"
      >
        {/* Gradient top beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-70" />

        {/* Logo and Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: easeOutExpo }}
          className="flex flex-col items-center gap-2 mb-8"
        >
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-accent-primary via-accent-highlight to-accent-secondary-glow flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.6)]"
          >
            <Sparkles size={20} color="#FFFFFF" className="animate-pulse" />
          </motion.div>
          <h2 className="text-text-primary text-xl font-display font-semibold mt-2">Welcome Back</h2>
          <p className="text-xs text-text-secondary text-center">
            Access your sales pipelines and deals analytics dashboard.
          </p>
        </motion.div>

        {/* Global auth error */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/25 text-xs text-danger font-semibold text-center select-text shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              {authError}
            </div>
          )}
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 select-text">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: easeOutExpo }}
          >
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: easeOutExpo }}
          >
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: easeOutExpo }}
          >
            <div className="flex items-center justify-between mt-2 mb-1">
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent-primary cursor-pointer"
                />
                Keep me signed in
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-accent-glow hover:text-accent-secondary-glow font-semibold transition-colors outline-none"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" variant="primary" fullWidth disabled={loading} loading={loading} className="mt-2">
              {loading ? 'Authenticating' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </motion.div>
        </form>

        {/* Auth redirection footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-8 border-t border-overlay/5 pt-4 text-center text-xs text-text-secondary flex flex-col gap-3"
        >
          <div>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-accent-glow hover:text-accent-secondary-glow font-semibold transition-colors outline-none"
            >
              Sign up here
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Login;
