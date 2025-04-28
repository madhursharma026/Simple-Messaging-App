import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { CreateMessageInput } from './dto/create-message.input';
import { Message } from './entities/message.entity';

const pubSub = new PubSub();

@Injectable()
export class ChatService {
  private messages: Message[] = [];
  private idCounter = 1;

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

  getPubSub(): PubSub {
    return pubSub;
  }
}
