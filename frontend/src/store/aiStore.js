// frontend/src/store/aiStore.js
// Zustand store for the AI copilot assistant. Powers both the dashboard AI panel and the
// global floating AI launcher overlay. Sends natural-language questions to /api/ai/assistant
// and lead follow-up drafting to /api/ai/draft-follow-up. Provider-agnostic (backend decides).
// Used in: components/dashboard/rightPanel/AIAssistantPanel.jsx, components/ai/AIAssistantOverlay.jsx,
//          components/layout/FloatingAIButton.jsx, pages/Dashboard.jsx (AiInsightCard).

import { create } from 'zustand';
import api, { baseURL } from '../api/axios';
import { useAuthStore } from './authStore';
import { sanitizeText, sanitizeErrorMessage } from '../utils/security';

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'ai',
  text: "Hi! I'm your CRM copilot. Ask me about your leads and deals, or draft a follow-up message.",
};

const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 16;
const VALID_ROLES = new Set(['user', 'assistant', 'system']);

export function messageId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

// Validates and trims a message string. Rejects null/undefined/empty/whitespace.
// Strips control characters, normalizes line endings, and truncates to MAX_MESSAGE_LENGTH.
export function validateMessage(text) {
  if (text == null) return null;
  const cleaned = sanitizeText(String(text));
  if (!cleaned) return null;
  return cleaned;
}

// Validates history array — each entry must have role (string) and content (string).
// Returns a sanitized, capped copy. Invalid items are silently dropped.
export function validateHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && typeof m === 'object' && m.role && typeof m.content === 'string')
    .filter((m) => VALID_ROLES.has(String(m.role).toLowerCase()))
    .map((m) => ({
      role: String(m.role).toLowerCase(),
      content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}

export const useAiStore = create((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  error: null,
  isOpen: false,
  // Tracks the current in-flight request ID for race-condition detection.
  _currentRequestId: null,
  // Map of request ID -> AbortController for all in-flight requests.
  // Only one entry should exist at a time per the single-stream invariant.
  _controllers: new Map(),

  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),

  // Aborts ALL in-flight AI requests. Called internally before starting a new
  // request, and externally on component unmount / page navigation / reset().
  _abortAll: () => {
    const { _controllers } = get();
    for (const controller of _controllers.values()) {
      controller.abort();
    }
    _controllers.clear();
  },

  reset: () => {
    get()._abortAll();
    set({ messages: [WELCOME_MESSAGE], error: null, isTyping: false, _currentRequestId: null });
  },

  // Use case (a): internal assistant — natural-language Q&A about the user's CRM data.
  // Streams the reply token-by-token over SSE (POST /api/ai/chat) so text appears
  // live as Groq generates it, with abort/stop support and race-condition guards.
  sendMessage: async (text, history = []) => {
    const trimmed = validateMessage(text);
    if (!trimmed) return;

    const requestId = messageId();
    const controller = new AbortController();
    const userMsg = { id: messageId(), sender: 'user', text: trimmed };

    // Step 1: Abort any in-flight request. This ensures only ONE stream exists.
    // The previous request's response will be ignored via _currentRequestId check.
    get()._abortAll();

    // Step 2: Register this request as the active one BEFORE setting state.
    const sanitizedHistory = validateHistory(history);
    get()._controllers.set(requestId, controller);

    set((s) => ({
      messages: [...s.messages.slice(-MAX_MESSAGES + 1), userMsg],
      isTyping: true,
      error: null,
      _currentRequestId: requestId,
    }));

    let aiMsg = null;
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${baseURL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, history: sanitizedHistory }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = 'The assistant is temporarily unavailable.';
        try {
          const err = await response.json();
          message = err.message || message;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(message);
      }
      if (!response.body) throw new Error('Streaming is not supported by this browser.');

      // Create the assistant message now so tokens can append into it.
      aiMsg = { id: messageId(), sender: 'ai', text: '' };
      set((s) => ({
        messages: [...s.messages.slice(-MAX_MESSAGES + 1), aiMsg],
      }));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const appendToken = (chunk) => {
        // Race condition guard: only process if this is still the current request.
        if (get()._currentRequestId !== requestId) return false;
        if (controller.signal.aborted) return false;
        aiMsg.text += chunk;
        set((s) => ({
          messages: s.messages.map((m) => (m.id === aiMsg.id ? { ...m, text: aiMsg.text } : m)),
        }));
        return true;
      };

      // Read the SSE stream until the "done" event or the stream closes.
      let finished = false;
      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line.
        const events = buffer.split('\n\n');
        buffer = events.pop();

        for (const rawEvent of events) {
          const dataLine = rawEvent
            .split('\n')
            .map((l) => l.trim())
            .find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          let payload;
          try {
            payload = JSON.parse(dataLine.slice(6));
          } catch {
            continue;
          }

          if (payload.type === 'token' && typeof payload.text === 'string') {
            if (!appendToken(payload.text)) {
              finished = true;
              break;
            }
          } else if (payload.type === 'error') {
            throw new Error(payload.message || 'The assistant is temporarily unavailable.');
          } else if (payload.type === 'done') {
            finished = true;
            break;
          }
        }
      }

      // Race condition guard: if a newer request has started, ignore this one.
      if (get()._currentRequestId !== requestId) return;
      if (controller.signal.aborted) return;

      const replyText = sanitizeText(aiMsg.text.trim());
      if (replyText) {
        aiMsg.text = replyText;
      } else {
        // Empty stream (e.g. nothing generated) — drop the placeholder.
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== aiMsg.id),
        }));
        aiMsg = null;
      }

      set((s) => ({
        messages: aiMsg
          ? s.messages.map((m) => (m.id === aiMsg.id ? { ...m, text: aiMsg.text } : m))
          : s.messages,
        isTyping: false,
        error: null,
        _currentRequestId: null,
      }));
    } catch (error) {
      // Race condition guard: skip if request was superseded.
      if (get()._currentRequestId !== requestId) return;
      // AbortError is expected when a newer request cancels this one — handle silently.
      if (controller.signal.aborted || error.name === 'AbortError') return;

      const message = sanitizeErrorMessage(error, 'The assistant is unavailable right now.');

      // If we already rendered a partial reply, mark it instead of adding a new bubble.
      if (aiMsg && get().messages.some((m) => m.id === aiMsg.id)) {
        const errMsg = { ...aiMsg, text: message, isError: true };
        set((s) => ({
          messages: s.messages.map((m) => (m.id === aiMsg.id ? errMsg : m)),
          isTyping: false,
          error: message,
          _currentRequestId: null,
        }));
      } else {
        const errMsg = { id: messageId(), sender: 'ai', text: message, isError: true };
        set((s) => ({
          messages: [...s.messages.slice(-MAX_MESSAGES + 1), errMsg],
          isTyping: false,
          error: message,
          _currentRequestId: null,
        }));
      }
    } finally {
      // Always cleanup: remove controller and reset request ID if still current.
      get()._controllers.delete(requestId);
      if (get()._currentRequestId === requestId) {
        set({
          isTyping: false,
          _currentRequestId: null,
        });
      }
    }
  },

  // Use case (b): auto-draft a follow-up message for a lead and append it as an assistant reply.
  draftFollowUp: async (leadId, leadLabel, history = []) => {
    if (!leadId || Number.isNaN(Number(leadId))) return;

    const requestId = messageId();
    const controller = new AbortController();
    const userPrompt = `Draft a follow-up for ${leadLabel}`;
    const userMsg = { id: messageId(), sender: 'user', text: userPrompt };

    // Abort any in-flight request before starting a new one (single-stream invariant).
    get()._abortAll();

    const sanitizedHistory = validateHistory(history);
    get()._controllers.set(requestId, controller);

    set((s) => ({
      messages: [...s.messages.slice(-MAX_MESSAGES + 1), userMsg],
      isTyping: true,
      error: null,
      _currentRequestId: requestId,
    }));

    try {
      const response = await api.post(
        '/ai/draft-follow-up',
        { leadId, history: sanitizedHistory },
        { signal: controller.signal }
      );

      // Race condition guard: only process if this is still the current request.
      if (get()._currentRequestId !== requestId) return;
      if (controller.signal.aborted) return;

      const reply = { id: messageId(), sender: 'ai', text: sanitizeText(response.data?.data?.text) };
      set((s) => ({
        messages: [...s.messages.slice(-MAX_MESSAGES + 1), reply],
        isTyping: false,
        error: null,
        _currentRequestId: null,
      }));
    } catch (error) {
      if (get()._currentRequestId !== requestId) return;
      if (controller.signal.aborted || error.name === 'AbortError') return;

      const message = sanitizeErrorMessage(error, 'Could not draft the follow-up right now.');
      const errMsg = { id: messageId(), sender: 'ai', text: message, isError: true };
      set((s) => ({
        messages: [...s.messages.slice(-MAX_MESSAGES + 1), errMsg],
        isTyping: false,
        error: message,
        _currentRequestId: null,
      }));
    } finally {
      get()._controllers.delete(requestId);
      if (get()._currentRequestId === requestId) {
        set({
          isTyping: false,
          _currentRequestId: null,
        });
      }
    }
  },

  // Stops any in-flight generation immediately (cancels the stream and clears
  // the typing state without mutating the message history).
  stopGenerating: () => {
    get()._abortAll();
    set({ isTyping: false, error: null, _currentRequestId: null });
  },

  // Retries the last user question. Useful after a failed or aborted reply.
  retryLast: async () => {
    const { messages, isTyping } = get();
    if (isTyping) return;
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
    if (!lastUser) return;
    await get().sendMessage(lastUser.text);
  },

  // Regenerates the latest assistant reply: removes the trailing AI message(s)
  // and resends the last user question so a fresh answer is produced.
  regenerateLast: async () => {
    const { messages, isTyping } = get();
    if (isTyping) return;
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].sender === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;
    const prompt = messages[lastUserIdx].text;
    get()._abortAll();
    set({ messages: messages.slice(0, lastUserIdx + 1), error: null, isTyping: false, _currentRequestId: null });
    await get().sendMessage(prompt);
  },
}));
