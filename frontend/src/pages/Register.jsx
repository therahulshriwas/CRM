// frontend/src/pages/Register.jsx
// Cinematic signup: perspective cyber grid, aurora orbs, floating glass panel with gradient
// beam, staggered field entrance, role selector and magnetic gradient CTA.
// Used in: Application routing root (/register).

import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Input from '../components/common/Input';
import Select from '../components/ui/Select';
import Button from '../components/common/Button';
import { User, Mail, Lock, Phone, Briefcase, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { validateEmail, validatePassword } from '../utils/validation';
import { easeOutExpo } from '../animations/variants';

const ROLE_OPTIONS = [
  { value: 'agent', label: 'Agent' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'admin', label: 'Admin' },
];

function Register() {
  const { register, loading, error: authError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: '',
    company: '',
    role: 'agent',
  });
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
    if (!formData.name.trim()) tempErrors.name = 'Full name is required';
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    if (emailError) tempErrors.email = emailError;
    if (passwordError) tempErrors.password = passwordError;
    if (!formData.confirmPassword) tempErrors.confirmPassword = 'Please confirm your password';
    if (formData.confirmPassword && formData.confirmPassword !== formData.password) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role,
      {
        phone: formData.phone,
        department: formData.department,
        company: formData.company,
      }
    );
    if (result.success) {
      navigate('/app');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen w-full flex items-center justify-center bg-bg-base overflow-y-auto px-4 py-8"
    >
      {/* Cinematic backdrop */}
      <div className="cyber-grid" />
      <div className="scanlines" />
      <div className="absolute top-[12%] left-[18%] w-[380px] h-[380px] rounded-full bg-accent-primary opacity-[0.12] blur-[110px] pointer-events-none float-bob" />
      <div className="absolute bottom-[12%] right-[18%] w-[380px] h-[380px] rounded-full bg-accent-highlight opacity-[0.12] blur-[110px] pointer-events-none float-bob-delay" />

      {/* Floating glass panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="relative w-full max-w-[440px] rounded-2xl glass-deep p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] z-10 select-none overflow-hidden"
      >
        {/* Gradient top beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-accent-glow to-transparent opacity-70" />

        {/* Logo and Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: easeOutExpo }}
          className="flex flex-col items-center gap-2 mb-6"
        >
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-accent-primary via-accent-highlight to-accent-secondary-glow flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.6)]"
          >
            <Sparkles size={20} color="#FFFFFF" className="animate-pulse" />
          </motion.div>
          <h2 className="text-text-primary text-xl font-display font-semibold mt-2">Create Account</h2>
          <p className="text-xs text-text-secondary text-center">
            Register your profile to begin managing leads and pipelines.
          </p>
        </motion.div>

        {/* Global auth error */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/25 text-xs text-danger font-semibold text-center select-text shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          >
            {authError}
          </motion.div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 select-text">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5, ease: easeOutExpo }}>
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} icon={User} required />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: easeOutExpo }}>
            <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} required />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: easeOutExpo }}>
            <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} error={errors.password} icon={Lock} required />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: easeOutExpo }}>
            <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} icon={Lock} required />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.5, ease: easeOutExpo }}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} icon={Phone} />
              <Input label="Department" name="department" value={formData.department} onChange={handleChange} icon={Briefcase} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: easeOutExpo }}>
            <Input label="Company" name="company" value={formData.company} onChange={handleChange} icon={Building2} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5, ease: easeOutExpo }}>
            <Select
              label="Role"
              value={formData.role}
              options={ROLE_OPTIONS}
              onChange={(role) => setFormData((prev) => ({ ...prev, role }))}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5, ease: easeOutExpo }}>
            <Button type="submit" variant="primary" fullWidth disabled={loading} loading={loading} className="mt-3">
              {loading ? 'Registering' : 'Get Started'}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </motion.div>
        </form>

        {/* Redirection link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="mt-6 border-t border-overlay/5 pt-4 text-center text-xs text-text-secondary"
        >
          Already have an account?{' '}
          <Link to="/login" className="text-accent-glow hover:text-accent-secondary-glow font-semibold transition-colors outline-none">
            Sign in here
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Register;
