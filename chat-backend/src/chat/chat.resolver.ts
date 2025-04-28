import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { CreateMessageInput } from './dto/create-message.input';
import { Message } from './entities/message.entity';

@Resolver(() => Message)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Mutation(() => Message)
  async sendMessage(
    @Args('createMessageInput') createMessageInput: CreateMessageInput,
  ): Promise<Message> {
    return this.chatService.createMessage(createMessageInput);
  }

  @Mutation(() => Message)
  async markAsRead(@Args('messageId') messageId: number): Promise<Message> {
    return this.chatService.markAsRead(messageId);
  }

  @Subscription(() => Message, {
    filter: (payload, variables) => {
      const { messageSent } = payload;
      return (
        (messageSent.sender_id === variables.sender_id &&
          messageSent.receiver_id === variables.receiver_id) ||
        (messageSent.sender_id === variables.receiver_id &&
          messageSent.receiver_id === variables.sender_id)
      );
    },
  })
  messageSent(
    @Args('sender_id') sender_id: string,
    @Args('receiver_id') receiver_id: string,
  ) {
    return this.chatService.getPubSub().asyncIterableIterator('messageSent');
  }

  @Subscription(() => Message, {
    filter: (payload, variables) => {
      const { messageRead } = payload;
      return (
        (messageRead.sender_id === variables.sender_id &&
          messageRead.receiver_id === variables.receiver_id) ||
        (messageRead.sender_id === variables.receiver_id &&
          messageRead.receiver_id === variables.sender_id)
      );
    },
  })
  messageRead(
    @Args('sender_id') sender_id: string,
    @Args('receiver_id') receiver_id: string,
  ) {
    return this.chatService.getPubSub().asyncIterableIterator('messageRead');
  }

  @Query(() => [Message])
  async getMessages(
    @Args('sender_id') sender_id: string,
    @Args('receiver_id') receiver_id: string,
  ): Promise<Message[]> {
    return this.chatService.getMessages(sender_id, receiver_id);
  }
}
