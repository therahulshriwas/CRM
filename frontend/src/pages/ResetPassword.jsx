// frontend/src/pages/ResetPassword.jsx
// Verifies the emailed OTP and sets a new password. Mirrors the glassmorphic auth card style.
// Used in: App.jsx /reset-password route.

import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { pageVariants } from '../animations/variants';
import { ShieldCheck, ArrowLeft, LockOpen } from 'lucide-react';
import { validateEmail, validatePassword } from '../utils/validation';

function ResetPassword() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!formData.otp.trim()) tempErrors.otp = 'OTP is required';
    if (passwordError) tempErrors.password = passwordError;
    if (formData.confirmPassword !== formData.password) tempErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Reset failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen w-full flex items-center justify-center bg-bg-base overflow-hidden px-4"
    >
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-accent-primary opacity-[0.08] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-accent-highlight opacity-[0.08] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] rounded-2xl glass p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-10 select-none">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-r from-accent-primary to-accent-highlight flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.4)]">
            <LockOpen size={20} color="#FFFFFF" className="animate-pulse" />
          </div>
          <h2 className="text-text-primary text-xl font-display font-semibold mt-2">Reset Password</h2>
          <p className="text-xs text-text-secondary text-center">
            Enter the 6-digit code from your email and choose a new password.
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-semibold text-center select-text">
            {errors.form}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <ShieldCheck size={32} className="text-success" />
            <p className="text-text-primary text-sm font-semibold">Password reset successful</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              You can now sign in with your new password. Redirecting...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 select-text">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Input
              label="Reset Code (OTP)"
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              error={errors.otp}
              placeholder="6-digit code"
              required
            />
            <Input
              label="New Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />
            <Button type="submit" variant="primary" fullWidth disabled={loading} className="mt-1">
              {loading ? 'Resetting...' : 'Reset Password'}
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
      </div>
    </motion.div>
  );
}

export default ResetPassword;
