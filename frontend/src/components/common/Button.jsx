// frontend/src/components/common/Button.jsx
// Reusable futuristic button: gradient primary with shine sweep + halo, glass secondary,
// ghost variant, and magnetic spring hover via Framer Motion. Optional loading spinner.
// Used in: Pages (Login, Register, Dashboard, modals) and forms.

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { magnetic } from '../../animations/variants';

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' (gradient glow) | 'secondary' (glass) | 'ghost'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  const sizes = {
    xs: 'text-xs py-1.5 px-2.5 rounded-lg gap-1',
    sm: 'text-xs py-2 px-4 rounded-lg gap-1.5',
    md: 'text-sm py-3 px-6 rounded-xl gap-2',
    lg: 'text-sm py-3.5 px-8 rounded-2xl gap-2',
  };

  const baseClasses = `
    relative font-display font-semibold motion-interactive
    outline-none select-none cursor-pointer flex items-center justify-center overflow-hidden
    focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base
    ${sizes[size]}
    ${fullWidth ? 'w-full' : 'w-fit'}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  let variantClasses;
  if (variant === 'primary') {
    variantClasses = `
      text-white border border-transparent
      bg-gradient-to-r from-accent-primary via-accent-highlight to-accent-primary bg-[length:200%_100%]
      shadow-elevation-2 hover:bg-[position:100%_0] hover:shadow-elevation-3
    `;
  } else if (variant === 'ghost') {
    variantClasses = `
      text-text-secondary hover:text-text-primary
      border border-overlay/10 bg-overlay/2 hover:bg-overlay/5
    `;
  } else {
    variantClasses = `
      glass text-text-primary hover:bg-overlay/5 hover:border-accent-primary/30
    `;
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variants={disabled || loading ? {} : magnetic}
      initial="rest"
      whileHover={disabled || loading ? {} : 'hover'}
      whileTap={disabled || loading ? {} : 'tap'}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {/* Ambient glow halo behind primary buttons */}
      {variant === 'primary' && !disabled && !loading && (
        <span className="absolute inset-0 halo bg-gradient-to-r from-accent-primary to-accent-highlight opacity-30 blur-xl pointer-events-none" />
      )}
      {/* Shine sweep ray */}
      {variant === 'primary' && !disabled && (
        <span className="shine-sweep absolute inset-0 pointer-events-none" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <Loader2 size={16} className="animate-spin icon-stroke" />}
        {children}
      </span>
    </motion.button>
  );
}

export default Button;
