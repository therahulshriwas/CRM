// frontend/src/pages/Chat.jsx
// Team Chat — real-time one-to-one/group conversations with typing indicators, read receipts
// and unread badges. Powered by chatStore + Socket.io. Replaces the Phase 1 placeholder.
// Used in: App.jsx /chat route.

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../api/axios';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import LoadingScreen from '../components/common/LoadingScreen';
import { formatRelativeTime } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import { MessageSquare, Search, Send, Users, CheckCheck, PenSquare, ChevronLeft } from 'lucide-react';

function dayLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(date, today)) return 'Today';
  if (same(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Chat() {
  const { user, socketInstance: socket } = useAuthStore();
  const {
    conversations,
    activeId,
    messages,
    unreadByConversation,
    typingUsers,
    loadingConversations,
    loadingMessages,
    sending,
    init,
    fetchConversations,
    openConversation,
    sendMessage,
    emitTyping,
  } = useChatStore();

  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newChatError, setNewChatError] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const threadEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Attach chat socket listeners whenever the socket (re)connects.
  useEffect(() => {
    init(socket);
    return () => {
      init(null);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [init, socket]);

  // Load conversation list once on mount.
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-scroll to the newest message when the thread changes.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    if (activeId) {
      setShowConversationList(false);
    }
  }, [activeId]);

  // The other participant for direct chats; all names otherwise.
  const participantLabel = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    const others = (conversation.participants || []).filter((p) => p.id !== user?.id);
    return others.map((p) => p.name).join(', ') || 'Conversation';
  };

  // Avatar URL of the other participant for direct chats; null for groups.
  const participantAvatar = (conversation) => {
    if (conversation.type === 'group') return null;
    const others = (conversation.participants || []).filter((p) => p.id !== user?.id);
    return resolveMediaUrl(others[0]?.avatar_url);
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const label = participantLabel(c).toLowerCase();
      const last = c.lastMessage?.content?.toLowerCase() || '';
      return label.includes(q) || last.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchQuery]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft('');
    emitTyping(false);
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  const handleOpenNewChat = async () => {
    setShowNewChat(true);
    setNewChatError('');
    setSelectedUsers([]);
    try {
      const response = await api.get('/users');
      setAllUsers((response.data.users || []).filter((u) => u.id !== user?.id));
    } catch (error) {
      setNewChatError(error.response?.data?.message || 'Failed to load users.');
    }
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const startConversation = async () => {
    if (selectedUsers.length === 0) {
      setNewChatError('Select at least one teammate.');
      return;
    }
    setNewChatError('');
    try {
      const response = await api.post('/chat/conversations', {
        type: selectedUsers.length === 1 ? 'direct' : 'group',
        participantIds: selectedUsers,
      });
      setShowNewChat(false);
      await fetchConversations();
      openConversation(response.data.conversation.id);
    } catch (error) {
      setNewChatError(error.response?.data?.message || 'Failed to create conversation.');
    }
  };

  const activeTyping = activeId ? Object.values(typingUsers[activeId] || {}) : [];

  return (
    <div className="relative h-[calc(100vh-140px)] min-h-[480px] flex gap-4">
      {/* ===== Conversation List ===== */}
      <div className={`
        w-[320px] shrink-0 flex flex-col glass rounded-2xl overflow-hidden
        max-lg:absolute max-lg:left-0 max-lg:top-0 max-lg:z-30 max-lg:h-full max-lg:shadow-[0_12px_40px_rgba(0,0,0,0.6)]
        transition-transform duration-300 ease-in-out
        ${showConversationList ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-4 border-b border-overlay/5 flex items-center justify-between select-none">
          <h3 className="text-text-primary font-display font-semibold">Messages</h3>
          <button
            onClick={handleOpenNewChat}
            className="p-2 rounded-xl bg-gradient-to-r from-accent-primary to-accent-highlight text-white hover:opacity-90 transition-opacity cursor-pointer outline-none"
             aria-label="New conversation"
             title="New conversation"
          >
            <PenSquare size={15} />
          </button>
        </div>

        <div className="p-3 border-b border-overlay/5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-text-secondary" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
               aria-label="Search conversations"
               placeholder="Search messages..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-card border border-overlay/5 text-text-primary text-xs outline-none focus:border-accent-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations && !conversations.length ? (
            <LoadingScreen label="Loading conversations..." />
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              description="Start a chat with a teammate using the compose button."
            />
          ) : (
            filteredConversations.map((c) => {
              const unread = unreadByConversation[c.id] || 0;
              const active = c.id === activeId;
              const label = participantLabel(c);
              const preview = c.lastMessage?.content || 'No messages yet';
              const time = c.lastMessage?.createdAt || c.createdAt;
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer outline-none border-l-2 ${
                    active
                      ? 'bg-accent-primary/10 border-accent-primary'
                      : 'border-transparent hover:bg-bg-hover'
                  }`}
                >
                  <Avatar name={label} size={40} src={participantAvatar(c)} showStatus />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text-primary text-sm font-semibold truncate">{label}</span>
                      <span className="text-[10px] text-text-secondary/60 shrink-0">{formatRelativeTime(time)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-text-secondary truncate">
                        {c.lastMessage?.sender?.id === user?.id ? 'You: ' : ''}
                        {preview}
                      </span>
                      {unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-highlight text-white text-[10px] font-bold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ===== Message Thread ===== */}
      <div className={`
        flex-1 flex flex-col glass rounded-2xl overflow-hidden
        ${!showConversationList ? 'max-lg:relative max-lg:z-20' : 'max-lg:hidden'}
        lg:relative lg:z-auto
      `}>
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="p-4 rounded-2xl bg-bg-card border border-overlay/5">
              <MessageSquare size={28} className="text-accent-glow" />
            </div>
            <span className="text-text-primary font-display font-semibold">Select a conversation</span>
            <span className="text-xs text-text-secondary max-w-[300px]">
              Choose a thread on the left to start chatting with your team in real time.
            </span>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3.5 border-b border-overlay/5 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConversationList(true)}
                   aria-label="Back to conversations"
                   className="lg:hidden p-1.5 rounded-lg hover:bg-overlay/5 text-text-secondary hover:text-text-primary transition-colors"
                  title="Back to conversations"
                >
                  <ChevronLeft size={18} />
                </button>
                <Avatar name={participantLabel(activeConversation)} size={38} src={participantAvatar(activeConversation)} showStatus />
                <div className="flex flex-col">
                  <span className="text-text-primary text-sm font-semibold">
                    {participantLabel(activeConversation)}
                  </span>
                  <span className="text-[10px] text-text-secondary/70 flex items-center gap-1">
                    <Users size={11} />
                    {activeConversation.participants?.length || 1} participant
                    {(activeConversation.participants?.length || 1) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {activeTyping.length > 0 && (
                <span className="text-[10px] text-accent-glow font-medium animate-pulse">
                  {activeTyping.join(', ')} is typing...
                </span>
              )}
            </div>

            {/* Messages */}
            <div role="log" aria-live="polite" aria-label="Conversation messages" className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 bg-bg-secondary/40">
              {loadingMessages ? (
                <LoadingScreen label="Loading messages..." />
              ) : messages.length === 0 ? (
                <EmptyState
                  title="No messages yet"
                  description="Say hello to start the conversation."
                />
              ) : (
                messages.map((msg, idx) => {
                   const own = (msg.sender_id ?? msg.sender?.id) === user?.id;
                  const prev = messages[idx - 1];
                  const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(msg.createdAt);
                  return (
                    <React.Fragment key={msg.id}>
                      {newDay && (
                        <div className="flex justify-center my-3">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-text-secondary/70 bg-bg-card border border-overlay/5">
                            {dayLabel(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${own ? 'justify-end' : 'justify-start'} ${idx > 0 && messages[idx - 1].sender_id === msg.sender_id ? 'mt-0.5' : 'mt-2'}`}>
                        <div className={`max-w-[65%] flex flex-col gap-1 ${own ? 'items-end' : 'items-start'}`}>
                          {!own && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id) && (
                             <span className="text-[10px] text-text-secondary/70 px-1">
                               {msg.sender?.name || 'Teammate'}
                            </span>
                          )}
                          <div
                            className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                              own
                                ? 'bg-gradient-to-r from-accent-primary to-accent-highlight text-white rounded-br-md shadow-[0_2px_10px_rgba(124,58,237,0.25)]'
                                : 'bg-bg-card border border-overlay/5 text-text-primary rounded-bl-md'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-text-secondary/50 flex items-center gap-1 px-1">
                            {formatRelativeTime(msg.createdAt)}
                            {own && (
                              <CheckCheck
                                size={12}
                                className={msg.is_read ? 'text-success' : 'text-text-secondary/50'}
                              />
                            )}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-overlay/5 bg-bg-surface/50">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    emitTyping(true);
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
                  }}
                  onKeyDown={handleComposerKeyDown}
                  onBlur={() => emitTyping(false)}
                  rows={1}
                   aria-label="Message composer"
                   placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                  className="flex-1 px-4 py-3 rounded-xl bg-bg-card border border-overlay/5 text-text-primary text-sm outline-none focus:border-accent-primary transition-colors resize-none max-h-[120px]"
                />
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="!px-4 !py-3"
                  title="Send message"
                >
                  <Send size={15} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== New Conversation Modal ===== */}
      <Modal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        title="New Conversation"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4">
          {newChatError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-semibold">
              {newChatError}
            </div>
          )}
          <p className="text-xs text-text-secondary">
            Select one teammate for a direct chat, or several to start a group conversation.
          </p>
          <div className="max-h-[280px] overflow-y-auto flex flex-col gap-1.5 pr-1">
            {allUsers.map((u) => {
              const checked = selectedUsers.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                     aria-pressed={checked}
                     className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer outline-none ${
                    checked
                      ? 'bg-accent-primary/10 border-accent-primary'
                      : 'bg-bg-card border-overlay/5 hover:bg-bg-hover'
                  }`}
                >
                  <Avatar name={u.name} role={u.role} size={34} src={resolveMediaUrl(u.avatar_url)} />
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm text-text-primary font-medium truncate">{u.name}</span>
                    <span className="text-[10px] text-text-secondary/70">{u.email}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary/50 px-1.5 py-0.5 rounded border border-overlay/10">
                    {u.role.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
          <Button variant="primary" fullWidth onClick={startConversation} disabled={selectedUsers.length === 0}>
            Start Chat
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Chat;
