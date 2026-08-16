// backend/sockets/chatSocket.js
// Real-time chat via Socket.io: users join their personal + conversation rooms, send messages,
// broadcast typing indicators and read receipts, and trigger in-app notifications.
// Used in: backend/server.js after initSocket.

const { Message, ConversationParticipant, User } = require('../models');
const { createNotification } = require('../services/notification.service');

function initChatSocket(io) {
  io.on('connection', (socket) => {
    // Personal room â€” used for delivering notification:new events.
    socket.join(`user:${socket.user.id}`);

    socket.on('chat:join', async ({ conversationId }, ack) => {
      const isMember = await ConversationParticipant.findOne({
        where: { conversation_id: conversationId, user_id: socket.user.id },
      });
      if (!isMember) return ack?.({ ok: false, message: 'You are not a participant of this conversation.' });
      socket.join(`conversation:${conversationId}`);
      ack?.({ ok: true });
    });

    socket.on('chat:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Sends a message: persists it, broadcasts to the room, and notifies other participants.
    socket.on('chat:message', async ({ conversationId, content }, ack) => {
      try {
        if (!content || !content.trim()) {
          return ack?.({ ok: false, message: 'Message content is required.' });
        }

        const isMember = await ConversationParticipant.findOne({
          where: { conversation_id: conversationId, user_id: socket.user.id },
        });
        if (!isMember) {
          return ack?.({ ok: false, message: 'You are not a participant of this conversation.' });
        }

        const message = await Message.create({
          conversation_id: conversationId,
          sender_id: socket.user.id,
          content: content.trim(),
        });

        const fullMessage = await Message.findByPk(message.id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] }],
        });

        io.to(`conversation:${conversationId}`).emit('chat:message', fullMessage);
        ack?.({ ok: true, message: fullMessage });

        // In-app notifications for the other participants.
        const participants = await ConversationParticipant.findAll({
          where: { conversation_id: conversationId },
        });
        for (const p of participants) {
          if (p.user_id !== socket.user.id) {
            createNotification({
              userId: p.user_id,
              type: 'message',
              title: 'New message',
              message: `${socket.user.name}: ${content.trim().slice(0, 120)}`,
            }).catch(() => {});
          }
        }
      } catch (error) {
        console.error('chat:message error:', error.message);
        ack?.({ ok: false, message: 'Failed to send message.' });
      }
    });

    // Typing indicator relay â€” only sent to other members of the conversation room.
    socket.on('chat:typing', async ({ conversationId, isTyping }) => {
      const isMember = await ConversationParticipant.findOne({
        where: { conversation_id: conversationId, user_id: socket.user.id },
      });
      if (!isMember) return;
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId: socket.user.id,
        name: socket.user.name,
        isTyping: Boolean(isTyping),
      });
    });

    // Read receipts: mark messages read and notify the room.
    socket.on('chat:read', async ({ conversationId }) => {
      try {
        const isMember = await ConversationParticipant.findOne({
          where: { conversation_id: conversationId, user_id: socket.user.id },
        });
        if (!isMember) return;
        const { Op } = require('sequelize');
        await Message.update(
          { is_read: true },
          {
            where: {
              conversation_id: conversationId,
              sender_id: { [Op.ne]: socket.user.id },
              is_read: false,
            },
          }
        );
        io.to(`conversation:${conversationId}`).emit('chat:read', {
          conversationId,
          userId: socket.user.id,
        });
      } catch (error) {
        console.error('chat:read error:', error.message);
      }
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.user.id}`);
    });
  });
}

module.exports = initChatSocket;

