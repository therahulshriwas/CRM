// frontend/src/components/ai/AIAssistantChat.jsx
// Shared AI chat body (message log + typing indicator + composer) used by both the dashboard
// AIAssistantPanel and the global AIAssistantOverlay. Reads/writes the shared aiStore.
// Used in: components/ai/AIAssistantOverlay.jsx, components/dashboard/rightPanel/AIAssistantPanel.jsx.

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Send, Sparkles, Square, RefreshCw, RotateCcw, Copy, Check } from 'lucide-react';
import { useAiStore } from '../../store/aiStore';
import { toast } from '../ui/toastStore';

// Memoized message bubble — only re-renders when its own props change.
const MessageBubble = memo(({ msg, copiedId, onCopy, onRetry, onRegenerate }) => {
  const { sender, text, isError } = msg;
  return (
    <div
      className={`group flex flex-col max-w-[85%] rounded-2xl p-3 text-xs select-text leading-normal ${
        sender === 'ai'
          ? 'bg-bg-card border border-overlay/5 text-text-primary self-start rounded-tl-none'
          : 'bg-accent-primary text-white self-end rounded-tr-none shadow-[0_4px_12px_rgba(124,58,237,0.25)]'
      }`}
    >
      {sender === 'ai' && (
        <div className="flex items-center gap-1 text-[9px] text-accent-secondary-glow font-bold uppercase tracking-wider mb-1">
          <Sparkles size={8} />
          <span>Copilot</span>
        </div>
      )}
      <span className={isError ? 'text-danger' : ''}>{text}</span>

      {/* Action row: copy / retry / regenerate */}
      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {sender === 'ai' && text && (
          <button
            onClick={() => onCopy(msg)}
            aria-label={copiedId === msg.id ? 'Response copied' : 'Copy response'}
            title="Copy response"
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-overlay/5 transition-colors cursor-pointer outline-none"
          >
            {copiedId === msg.id ? <Check size={11} className="text-success" /> : <Copy size={11} />}
          </button>
        )}
        {sender === 'ai' && isError && (
          <button
            onClick={onRetry}
            aria-label="Retry last response"
            title="Retry"
            className="flex items-center gap-1 p-1 rounded-md text-xs text-text-tertiary hover:text-accent-glow hover:bg-overlay/5 transition-colors cursor-pointer outline-none"
          >
            <RefreshCw size={11} />
            <span>Retry</span>
          </button>
        )}
        {sender === 'ai' && !isError && onRegenerate && (
          <button
            onClick={onRegenerate}
            aria-label="Regenerate response"
            title="Regenerate response"
            className="p-1 rounded-md text-text-tertiary hover:text-accent-glow hover:bg-overlay/5 transition-colors cursor-pointer outline-none"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// Memoized typing indicator — only re-renders when isTyping changes.
const TypingIndicator = memo(() => (
  <div className="bg-bg-card border border-overlay/5 text-text-primary rounded-2xl rounded-tl-none p-3 text-xs self-start flex gap-1 items-center" aria-label="Assistant is thinking">
    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" />
    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce delay-100" />
    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce delay-200" />
  </div>
));
TypingIndicator.displayName = 'TypingIndicator';

function AIAssistantChat() {
  // Individual selectors prevent re-renders when unrelated store state changes.
  const messages = useAiStore((s) => s.messages);
  const isTyping = useAiStore((s) => s.isTyping);
  const sendMessage = useAiStore((s) => s.sendMessage);
  const stopGenerating = useAiStore((s) => s.stopGenerating);
  const retryLast = useAiStore((s) => s.retryLast);
  const regenerateLast = useAiStore((s) => s.regenerateLast);
  const _abortAll = useAiStore((s) => s._abortAll);
  const [inputVal, setInputVal] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const scrollRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  // Track whether user is manually scrolling (not at bottom).
  const isAtBottomRef = useRef(true);

  // Abort any in-flight AI requests when the component unmounts.
  useEffect(() => {
    return () => {
      _abortAll();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [_abortAll]);

  // Smart auto-scroll: only scroll if user is near the bottom.
  // This prevents yanking the view while the user is reading older messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 60; // pixels from bottom
    const nearBottom = scrollHeight - (scrollTop + clientHeight) < threshold;

    if (nearBottom || isAtBottomRef.current) {
      isAtBottomRef.current = true;
      el.scrollTop = scrollHeight;
    }
  }, [messages, isTyping]);

  // Listen for manual scroll to track user intent (throttled via rAF).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const check = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = el;
          const threshold = 60;
          isAtBottomRef.current = scrollHeight - (scrollTop + clientHeight) < threshold;
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, []);

  const handleSend = useCallback((e) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;
    sendMessage(inputVal);
    setInputVal('');
  }, [inputVal, isTyping, sendMessage]);

  const handleStop = useCallback(() => {
    stopGenerating();
    toast.info('Generation stopped.');
  }, [stopGenerating]);

  const handleRetry = useCallback(() => {
    retryLast();
  }, [retryLast]);

  const handleRegenerate = useCallback(() => {
    regenerateLast();
  }, [regenerateLast]);

  const handleCopy = useCallback((msg) => {
    if (!msg.text) return;
    navigator.clipboard.writeText(msg.text)
      .then(() => {
        setCopiedId(msg.id);
        copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1500);
        toast.success('Copied to clipboard.');
      })
      .catch(() => toast.error('Clipboard access was unavailable.'));
  }, []);

  // Ctrl/Cmd+Enter is an alternative send shortcut (accessibility + laptop users).
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isTyping && inputVal.trim()) {
        sendMessage(inputVal);
        setInputVal('');
      }
    }
  }, [inputVal, isTyping, sendMessage]);

  return (
    <>
      {/* Scrollable message log */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="AI conversation"
        className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1 min-h-0"
      >
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            copiedId={copiedId}
            onCopy={handleCopy}
            onRetry={handleRetry}
            onRegenerate={!isTyping && idx === messages.length - 1 ? handleRegenerate : null}
          />
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="relative w-full select-text shrink-0">
        <input
          type="text"
          placeholder="Ask AI anything..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Ask AI anything"
          autoComplete="off"
          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl glass text-text-primary text-xs outline-none border border-overlay/5 focus:border-accent-primary transition-all font-sans"
        />
        {isTyping ? (
          <button
            type="button"
            onClick={handleStop}
            aria-label="Stop generating"
            title="Stop generating"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-overlay/5 text-danger hover:text-white transition-colors cursor-pointer border border-transparent outline-none"
          >
            <Square size={12} />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send message"
            disabled={!inputVal.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-overlay/5 text-accent-glow hover:text-white transition-colors cursor-pointer border border-transparent outline-none disabled:opacity-40"
          >
            <Send size={12} />
          </button>
        )}
      </form>
    </>
  );
}

export default AIAssistantChat;
