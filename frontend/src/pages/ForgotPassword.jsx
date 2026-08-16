// frontend/src/pages/ForgotPassword.jsx
// Requests a password-reset OTP by email. Mirrors the glassmorphic auth card style.
// Used in: App.jsx /forgot-password route, linked from Login.

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { KeyRound, ArrowLeft, MailCheck, Mail } from 'lucide-react';
import { validateEmail } from '../utils/validation';
import { easeOutExpo } from '../animations/variants';

function ForgotPassword() {
  const { isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen w-full flex items-center justify-center bg-bg-base overflow-hidden px-4"
    >
      <div className="cyber-grid" />
      <div className="scanlines" />
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-accent-primary opacity-[0.1] blur-[110px] pointer-events-none float-bob" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-accent-highlight opacity-[0.1] blur-[110px] pointer-events-none float-bob-delay" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="relative w-full max-w-[420px] rounded-2xl glass-deep p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] z-10 select-none overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-70" />

        <div className="flex flex-col items-center gap-2 mb-8">
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-accent-primary via-accent-highlight to-accent-secondary-glow flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.6)]"
          >
            <KeyRound size={20} color="#FFFFFF" className="animate-pulse" />
          </motion.div>
          <h2 className="text-text-primary text-xl font-display font-semibold mt-2">Forgot Password</h2>
          <p className="text-xs text-text-secondary text-center">
            Enter your account email and we'll send you a one-time code to reset your password.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/25 text-xs text-danger font-semibold text-center select-text shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          >
            {error}
          </motion.div>
        )}

        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              className="p-3 rounded-2xl bg-success/10 border border-success/25"
            >
              <MailCheck size={28} className="text-success" />
            </motion.div>
            <p className="text-text-primary text-sm font-semibold">Check your inbox</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              If <span className="text-text-primary font-medium">{email}</span> is registered, a 6-digit OTP has been
              sent. It expires in 10 minutes.
            </p>
            <div className="mt-2 flex flex-col gap-2 w-full">
              <Link to="/reset-password" className="w-full">
                <Button variant="primary" fullWidth>
                  I have a code — Continue
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 select-text">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              error={error}
              icon={Mail}
              required
            />
            <Button type="submit" variant="primary" fullWidth disabled={loading} loading={loading} className="mt-2">
              {loading ? 'Sending' : 'Send Reset Code'}
            </Button>
          </form>
        )}

        <div className="mt-8 border-t border-overlay/5 pt-4 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium transition-colors outline-none"
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ForgotPassword;
