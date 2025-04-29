import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { CreateMessageInput } from './dto/create-message.input';
import { Message } from './entities/message.entity';

const pubSub = new PubSub();

@Injectable()
export class ChatService {
  private messages: Message[] = [];
  private idCounter = 1;
  private activeSessions = new Map<string, Set<string>>();

  async createMessage(
    createMessageInput: CreateMessageInput,
  ): Promise<Message> {
    const message: Message = {
      id: this.idCounter++,
      sender_id: createMessageInput.sender_id,
      receiver_id: createMessageInput.receiver_id,
      content: createMessageInput.content,
      timestamp: new Date(),
      isRead: false,
    };

    this.messages.push(message);
    pubSub.publish('messageSent', { messageSent: message });
    return message;
  }

  async getMessages(
    sender_id: string,
    receiver_id: string,
  ): Promise<Message[]> {
    return this.messages.filter(
      (msg) =>
        (msg.sender_id === sender_id && msg.receiver_id === receiver_id) ||
        (msg.sender_id === receiver_id && msg.receiver_id === sender_id),
    );
  }

  async markAsRead(messageId: number): Promise<Message> {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    message.isRead = true;
    pubSub.publish('messageRead', { messageRead: message });
    return message;
  }

  private activeUsers = new Set<string>(); // Track active users

  async loginUser(userId: string, partnerId: string): Promise<void> {
    // Check if userId is already in a session with someone else
    if (
      this.activeSessions.has(userId) &&
      !this.activeSessions.get(userId)?.has(partnerId)
    ) {
      throw new Error(`${userId} is already in a session with someone else.`);
    }

    // Check if partnerId is already in a session with someone else
    if (
      this.activeSessions.has(partnerId) &&
      !this.activeSessions.get(partnerId)?.has(userId)
    ) {
      throw new Error(
        `${partnerId} is already in a session with someone else.`,
      );
    }

    // Create or update session
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, new Set());
    }
    if (!this.activeSessions.has(partnerId)) {
      this.activeSessions.set(partnerId, new Set());
    }

    this.activeSessions.get(userId)?.add(partnerId);
    this.activeSessions.get(partnerId)?.add(userId);
  }

  async logoutUser(userId: string): Promise<void> {
    const partners = this.activeSessions.get(userId);

    // Remove all messages related to this user
    this.messages = this.messages.filter(
      (msg) => msg.sender_id !== userId && msg.receiver_id !== userId,
    );

    if (partners) {
      for (const partnerId of partners) {
        const partnerSet = this.activeSessions.get(partnerId);
        partnerSet?.delete(userId); // remove the current user from partner's session

        // Notify the partner that the user has logged out
        pubSub.publish('userLoggedOut', { userLoggedOut: userId });

        if (partnerSet?.size === 0) {
          this.activeSessions.delete(partnerId);
        }
      }
      this.activeSessions.delete(userId);
    }
  }

  getPubSub(): PubSub {
    return pubSub;
  }
}
