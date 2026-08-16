// frontend/src/pages/AIWorkspace.jsx
// AI Workspace — dedicated full-page view of the CRM copilot assistant.
// Uses the existing aiStore (sendMessage to /api/ai/assistant, draftFollowUp to /api/ai/draft-follow-up).
// Used in: App.jsx /ai-workspace route.

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, RefreshCw, AlertCircle, Copy, Check, Square, RotateCcw } from 'lucide-react';
import { useAiStore } from '../store/aiStore';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import StatusState from '../components/ui/StatusState';
import { pageVariants, containerVariants, itemVariants } from '../animations/variants';
import { resolveMediaUrl } from '../utils/media';
import { toast } from '../components/ui/toastStore';

// Memoized message bubble — only re-renders when props change.
const MessageBubble = memo(({ msg, user, copiedId, onCopy, onRetry, onRegenerate }) => {
  const handleCopyClick = useCallback(() => {
    onCopy(msg.text, msg.id);
  }, [msg, onCopy]);

  return (
    <motion.div
      key={msg.id}
      variants={itemVariants}
      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {msg.sender === 'ai' && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-accent-primary to-accent-highlight flex items-center justify-center">
          <Sparkles size={15} className="text-white" />
        </div>
      )}
      <div
        className={`
          max-w-[70%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${msg.sender === 'user'
            ? 'bg-gradient-to-r from-accent-primary to-accent-highlight text-white rounded-br-md'
            : msg.isError
              ? 'bg-danger/5 border border-danger/20 text-danger'
              : 'bg-bg-card border border-overlay/5 text-text-primary rounded-bl-md'}
        `}
      >
        {msg.text}
        {msg.sender === 'ai' && !msg.isError && msg.text && (
          <button
            onClick={handleCopyClick}
            className="ml-2 inline-flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"
            aria-label={copiedId === msg.id ? 'Response copied' : 'Copy response'}
            title="Copy response"
          >
            {copiedId === msg.id ? <Check size={11} className="text-success" /> : <Copy size={11} className="text-text-tertiary" />}
          </button>
        )}
        {/* Inline action row: retry after error, regenerate the last AI reply */}
        {msg.sender === 'ai' && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {msg.isError && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-accent-glow transition-colors cursor-pointer outline-none rounded px-1.5 py-0.5 bg-overlay/5"
                aria-label="Retry last response"
              >
                <RefreshCw size={10} />
                Retry
              </button>
            )}
            {!msg.isError && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-accent-glow transition-colors cursor-pointer outline-none rounded px-1.5 py-0.5 bg-overlay/5"
                aria-label="Regenerate response"
              >
                <RotateCcw size={10} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
      {msg.sender === 'user' && (
        <Avatar name={user?.name || 'You'} role={user?.role || 'agent'} size={32} src={resolveMediaUrl(user?.avatar_url)} showStatus isOnline />
      )}
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// Memoized typing indicator — minimal re-rendering.
const TypingIndicator = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-3 justify-start"
    aria-label="Assistant is thinking"
  >
    <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-accent-primary to-accent-highlight flex items-center justify-center">
      <Sparkles size={15} className="text-white animate-pulse" />
    </div>
    <div className="px-4 py-3 rounded-2xl bg-bg-card border border-overlay/5 text-text-secondary text-sm">
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        Thinking
      </motion.span>
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
      >
        .
      </motion.span>
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
      >
        .
      </motion.span>
    </div>
  </motion.div>
));
TypingIndicator.displayName = 'TypingIndicator';

function AIWorkspace() {
  const { user } = useAuthStore();
  const messages = useAiStore((s) => s.messages);
  const isTyping = useAiStore((s) => s.isTyping);
  const error = useAiStore((s) => s.error);
  const sendMessage = useAiStore((s) => s.sendMessage);
  const reset = useAiStore((s) => s.reset);
  const stopGenerating = useAiStore((s) => s.stopGenerating);
  const retryLast = useAiStore((s) => s.retryLast);
  const regenerateLast = useAiStore((s) => s.regenerateLast);
  const _abortAll = useAiStore((s) => s._abortAll);
  const [draft, setDraft] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const threadEndRef = useRef(null);
  const inputRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const isAtBottomRef = useRef(true);

  // Abort any in-flight AI requests when the component unmounts.
  useEffect(() => {
    return () => {
      _abortAll();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [_abortAll]);

  // Smart auto-scroll: only scroll if user is near the bottom.
  useEffect(() => {
    const el = threadEndRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el.parentElement || {};
    if (scrollTop === undefined) return;

    const threshold = 60;
    const nearBottom = scrollHeight - (scrollTop + clientHeight) < threshold;

    if (nearBottom || isAtBottomRef.current) {
      isAtBottomRef.current = true;
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Listen for manual scroll to track user intent (throttled via rAF).
  useEffect(() => {
    const el = threadEndRef.current?.parentElement;
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

  const handleSend = useCallback(() => {
    if (!draft.trim() || isTyping) return;
    sendMessage(draft);
    setDraft('');
  }, [draft, isTyping, sendMessage]);

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

  const handleKeyDown = useCallback((e) => {
    // Enter sends; Shift+Enter adds a newline; Ctrl/Cmd+Enter also sends.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleCopy = useCallback((text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(id);
        copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1500);
        toast.success('Copied to clipboard.');
      })
      .catch(() => toast.error('Clipboard access was unavailable.'));
  }, []);

  const handleReset = useCallback(() => {
    reset();
    toast.success('Conversation reset.');
  }, [reset]);

  const lastMessageId = messages.length ? messages[messages.length - 1].id : null;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="AI Workspace"
        icon={Sparkles}
        subtitle="Your CRM copilot — ask about leads, deals, or draft follow-up messages."
        badge="AI"
        accent="#8B5CF6"
        actions={
          <div className="flex items-center gap-2.5">
            {isTyping && (
              <Button variant="ghost" size="sm" onClick={handleStop} aria-label="Stop generating" title="Stop generating">
                <Square size={14} className="text-danger" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} aria-label="Reset AI conversation" title="Reset conversation">
              <RefreshCw size={14} />
            </Button>
          </div>
        }
      />

      <Panel title="Conversation" subtitle="Ask me anything about your pipeline" icon={Sparkles} accent="#8B5CF6">
        <div className="flex flex-col h-[min(520px,calc(100vh-248px))] min-h-[360px]">
          {/* Message list */}
          <div role="log" aria-live="polite" aria-label="AI conversation" className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
            {messages.length === 0 ? (
              <StatusState
                type="empty"
                title="No messages yet"
                message="Ask a question to get started."
              />
            ) : (
              <motion.div
                key={messages.length}
                className="flex flex-col gap-4 group"
                variants={containerVariants}
                initial="initial"
                animate="animate"
              >
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    user={user}
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    onRetry={handleRetry}
                    onRegenerate={!isTyping && msg.id === lastMessageId && !msg.isError ? handleRegenerate : null}
                  />
                ))}

                {isTyping && <TypingIndicator />}
              </motion.div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Composer */}
          <div className="p-4 border-t border-overlay/5">
            {error && (
              <div className="mb-3 flex items-center gap-2 text-xs text-danger">
                <AlertCircle size={12} className="shrink-0" />
                <span>{error}</span>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 ml-auto text-[10px] px-2 py-1 rounded-lg bg-overlay/5 hover:bg-overlay/10 text-text-secondary hover:text-accent-glow transition-colors cursor-pointer outline-none"
                  aria-label="Retry last request"
                >
                  <RefreshCw size={10} />
                  Retry
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Ask the CRM copilot"
                placeholder="Ask about your leads, deals, or revenue..."
                className="flex-1 px-4 py-3 rounded-xl bg-bg-card border border-overlay/5 text-text-primary text-sm outline-none focus:border-accent-primary transition-colors resize-none max-h-[120px]"
                rows={1}
              />
              {isTyping ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  title="Stop generating"
                  className="!px-4 !py-3 !text-danger !border-danger/30 hover:!bg-danger/10"
                >
                  <Square size={14} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  title="Send message"
                  className="!px-4 !py-3"
                >
                  <Send size={14} />
                </Button>
              )}
            </div>
            <div className="mt-2 text-[10px] text-text-tertiary/50">
              Enter to send · Shift+Enter for a new line · Ctrl/Cmd+Enter also sends
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

export default AIWorkspace;
