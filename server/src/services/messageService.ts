import { messageRepository } from '../repositories/messageRepository.js';
import { dialogService } from './dialogService.js';
import type { MessageWithSender } from '../types.js';

export const messageService = {
  async send(
    dialogId: string,
    senderId: string,
    body: string
  ): Promise<MessageWithSender> {
    const isParticipant = await dialogService.ensureParticipant(dialogId, senderId);
    if (!isParticipant) throw new Error('FORBIDDEN');
    const msg = await messageRepository.create(dialogId, senderId, body);
    const full = await messageRepository.findById(msg.id);
    if (!full) throw new Error('Message not found');
    return full;
  },

  async getByDialog(dialogId: string, userId: string): Promise<MessageWithSender[]> {
    const isParticipant = await dialogService.ensureParticipant(dialogId, userId);
    if (!isParticipant) throw new Error('FORBIDDEN');
    return messageRepository.findByDialog(dialogId);
  },
};
