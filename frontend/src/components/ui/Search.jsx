// frontend/src/components/ui/Search.jsx
// =============================================================================
// Antigravity CRM — Design System 2.0
// -----------------------------------------------------------------------------
// Search field with a glass trigger, animated focus beam, clear button,
// loading spinner, and keyboard accessibility (Cmd+K hint badge optional).
//
// Props extend native input attributes. onSearch(value) fires on Enter.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';

function Search({
  value: controlledValue,
  onChange,
  onSearch,           // (value) => void — fires on Enter
  placeholder = 'Search…',
  loading = false,
  showShortcut = false,  // shows "⌘K" badge
  debounceMs = 0,
  className = '',
  ...props
}) {
  const [internal, setInternal] = useState('');
  const [focused, setFocused] = useState(false);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internal;
  const setInput = isControlled ? onChange : setInternal;

  // Debounced onChange
  useEffect(() => {
    if (debounceMs > 0 && onChange) {
      const t = setTimeout(() => onChange(value), debounceMs);
      return () => clearTimeout(t);
    }
  }, [value, debounceMs, onChange]);

  const handleKey = (e) => {
    if (e.key === 'Enter') onSearch?.(value);
  };

  const clear = () => {
    setInternal('');
    onChange?.('');
  };

  return (
    <div className={`relative w-full ${className}`}>
      <motion.div
        animate={{
          borderColor: focused ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.10)',
        }}
        className={`
          relative flex items-center gap-2
          glass rounded-xl
          border transition-colors duration-200
          ${focused ? 'shadow-[0_0_0_1px_rgba(124,58,237,0.4),0_0_20px_rgba(124,58,237,0.18)]' : ''}
          ${focused && isControlled === false ? '' : ''}
          pl-3 pr-3 py-2
        `}
      >
        <SearchIcon
          size={14}
          className={`shrink-0 transition-colors ${focused ? 'text-accent-glow' : 'text-text-tertiary'}`}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={props.disabled}
          className={`
            flex-1 text-sm text-text-primary placeholder:text-text-tertiary/60
            bg-transparent outline-none border-none
            leading-none
          `}
          {...props}
        />
        <AnimatePresence>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 size={14} className="animate-spin text-accent-glow" />
            </motion.div>
          ) : value && (
            <motion.button
              key="clear"
              whileTap={{ scale: 0.8 }}
              onClick={clear}
              className="p-0.5 rounded hover:bg-bg-hover text-text-tertiary hover:text-text-primary outline-none"
              aria-label="Clear search"
            >
              <X size={12} />
            </motion.button>
          )}
        </AnimatePresence>
        {showShortcut && (
          <kbd className="bg-overlay/10 px-1 py-0.5 rounded text-[9px] font-mono select-none border border-overlay/10">
            ⌘K
          </kbd>
        )}
      </motion.div>
    </div>
  );
}

export default Search;
