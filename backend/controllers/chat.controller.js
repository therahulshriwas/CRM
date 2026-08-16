// backend/controllers/chat.controller.js
// REST endpoints for conversations and messages (history retrieval and creation fallback).
// Real-time delivery is handled by sockets/chatSocket.js; sending a message here also broadcasts via Socket.io.
// Secure routes: admin, team_lead, agent (must be a participant to view/send in a conversation).

const { Conversation, ConversationParticipant, Message, User } = require('../models');
const { Op } = require('sequelize');
const { getIO } = require('../config/socket');
const { createNotification } = require('../services/notification.service');

// Verifies that the given user participates in a conversation.
async function assertParticipant(conversationId, userId) {
  const participant = await ConversationParticipant.findOne({
    where: { conversation_id: conversationId, user_id: userId },
  });
  return !!participant;
}

// Hydrates a conversation with participants and its most recent message.
async function hydrateConversation(conversation) {
  const participants = await conversation.getParticipants({
    attributes: ['id', 'name', 'email', 'role', 'avatar_url'],
    joinTableAttributes: [],
  });
  const lastMessage = await Message.findOne({
    where: { conversation_id: conversation.id },
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role', 'avatar_url'] }],
  });
  const serialized = conversation.toJSON();
  serialized.participants = participants;
  serialized.lastMessage = lastMessage;
  return serialized;
}

// Lists the authenticated user's conversations (most recently active first).
async function getConversations(req, res, next) {
  try {
    const conversations = await Conversation.findAll({
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'email', 'role', 'avatar_url'],
          through: { attributes: [] },
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Keep only conversations the user is part of.
    const userConversations = conversations.filter((c) =>
      c.participants.some((p) => p.id === req.user.id)
    );

    // Attach last message per conversation.
    const hydrated = await Promise.all(userConversations.map(hydrateConversation));

    return res.json({ conversations: hydrated });
  } catch (error) {
    next(error);
  }
}

// Creates a direct or group conversation with the supplied participant IDs.
async function createConversation(req, res, next) {
  try {
    const { type = 'direct', name, participantIds } = req.body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required.' });
    }

    // Deduplicate and always include the creator.
    const ids = [...new Set([req.user.id, ...participantIds.map(Number)])];
    if (ids.some((id) => Number.isNaN(id))) {
      return res.status(400).json({ message: 'Invalid participant IDs.' });
    }

    // For direct conversations, reuse an existing 1:1 thread if one exists.
    if (type === 'direct' && ids.length === 2) {
      const existing = await Conversation.findOne({
        where: { type: 'direct' },
        include: [{ model: User, as: 'participants', through: { attributes: [] } }],
      });
      if (existing) {
        const existingIds = existing.participants.map((p) => p.id).sort();
        const sortedIds = [...ids].sort();
        if (existingIds.length === 2 && existingIds[0] === sortedIds[0] && existingIds[1] === sortedIds[1]) {
          const hydrated = await hydrateConversation(existing);
          return res.status(200).json({ conversation: hydrated, reused: true });
        }
      }
    }

    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name || 'Group Chat' : null,
      created_by: req.user.id,
    });

    await ConversationParticipant.bulkCreate(
      ids.map((userId) => ({ conversation_id: conversation.id, user_id: userId }))
    );

    const fullConversation = await Conversation.findByPk(conversation.id);
    const hydrated = await hydrateConversation(fullConversation);

    return res.status(201).json({ conversation: hydrated });
  } catch (error) {
    next(error);
  }
}

// Returns paginated messages for a conversation the user participates in.
async function getMessages(req, res, next) {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const { page = 1, limit = 30 } = req.query;

    const isMember = await assertParticipant(conversationId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a participant of this conversation.' });
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Message.findAndCountAll({
      where: { conversation_id: conversationId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

    // Return chronological (ascending) for display.
    rows.reverse();

    return res.json({
      messages: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// REST fallback for sending a message; also broadcasts to the conversation room and notifies participants.
async function sendMessage(req, res, next) {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const isMember = await assertParticipant(conversationId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a participant of this conversation.' });
    }

    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: req.user.id,
      content: content.trim(),
    });

    const fullMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'email', 'role', 'avatar_url'] }],
    });

    // Broadcast to the conversation room (other connected participants get it instantly).
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('chat:message', fullMessage);

    // Create in-app notifications for the other participants.
    const participants = await ConversationParticipant.findAll({ where: { conversation_id: conversationId } });
    for (const p of participants) {
      if (p.user_id !== req.user.id) {
        createNotification({
          userId: p.user_id,
          type: 'message',
          title: 'New message',
          message: `${req.user.name}: ${content.trim().slice(0, 120)}`,
        }).catch(() => {});
      }
    }

    return res.status(201).json({ message: fullMessage });
  } catch (error) {
    next(error);
  }
}

// Marks all messages in a conversation as read for the current user.
async function markRead(req, res, next) {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const isMember = await assertParticipant(conversationId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a participant of this conversation.' });
    }

    await Message.update(
      { is_read: true },
      { where: { conversation_id: conversationId, sender_id: { [Op.ne]: req.user.id }, is_read: false } }
    );

    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('chat:read', {
      conversationId,
      userId: req.user.id,
    });

    return res.json({ message: 'Conversation marked as read.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markRead,
};

