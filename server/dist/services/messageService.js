import { messageRepository } from '../repositories/messageRepository.js';
import { dialogService } from './dialogService.js';
export const messageService = {
    async send(dialogId, senderId, body) {
        const isParticipant = await dialogService.ensureParticipant(dialogId, senderId);
        if (!isParticipant)
            throw new Error('FORBIDDEN');
        const msg = await messageRepository.create(dialogId, senderId, body);
        const full = await messageRepository.findById(msg.id);
        if (!full)
            throw new Error('Message not found');
        return full;
    },
    async getByDialog(dialogId, userId) {
        const isParticipant = await dialogService.ensureParticipant(dialogId, userId);
        if (!isParticipant)
            throw new Error('FORBIDDEN');
        return messageRepository.findByDialog(dialogId);
    },
};
