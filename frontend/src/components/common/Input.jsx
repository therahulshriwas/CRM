// frontend/src/components/common/Input.jsx
// Futuristic input: floating label, glass surface, animated focus underline beam,
// glowing ring on focus, optional leading icon, and inline error state.
// Used in: Login, Register, Forgot/Reset Password, and modals.

import React, { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  error = '',
  placeholder = '',
  icon: Icon = null,
  className = '',
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const generatedId = useId();
  const inputId = props.id || name || generatedId;
  const errorId = `${inputId}-error`;
  const isFilled = value !== undefined && value !== null && value.toString() !== '';

  return (
    <div className={`relative w-full flex flex-col gap-1 ${className}`}>
      <div className="relative w-full">
        {/* Soft glow behind the field when focused */}
        <span
          className={`absolute -inset-px rounded-xl pointer-events-none transition-opacity duration-300 ${
            focused && !error ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgb(var(--c-accent-primary) / 0.18), transparent 60%)' }}
        />

        {Icon && (
          <Icon
            size={16}
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
              focused ? 'text-accent-glow' : 'text-text-secondary/60'
            }`}
          />
        )}

        <input
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ''}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 pt-6 pb-2 rounded-xl text-text-primary text-sm font-sans
            glass motion-interactive outline-none border border-overlay/8 relative
            ${focused && !error ? 'border-accent-primary/60 shadow-focus' : ''}
            ${error ? 'border-danger/60 shadow-focus' : ''}
          `}
          {...props}
        />

        {/* Animated focus underline beam */}
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-500 origin-center ${
            focused && !error ? 'w-3/4 opacity-100' : 'w-0 opacity-0'
          }`}
           style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--c-accent-highlight)), rgb(var(--c-info)), transparent)' }}
        />

        {/* Floating Label */}
        <label htmlFor={inputId}
          className={`
            absolute ${Icon ? 'left-11' : 'left-4'} top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none transition-all duration-300
            ${focused || isFilled ? 'top-2.5 translate-y-0 text-xs text-accent-glow font-semibold' : ''}
            ${error ? 'text-danger' : ''}
          `}
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>
      </div>

      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            id={errorId}
            role="alert"
            className="text-xs text-danger mt-0.5 px-1"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Input;
