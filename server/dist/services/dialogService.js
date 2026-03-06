import { dialogRepository } from '../repositories/dialogRepository.js';
export const dialogService = {
    async getOrCreatePersonalDialog(userId, otherUserId) {
        return dialogRepository.findOrCreatePersonalDialog(userId, otherUserId);
    },
    async listDialogsForUser(userId) {
        const dialogs = await dialogRepository.findForUser(userId);
        const withOther = await Promise.all(dialogs.map(async (d) => {
            const other = await dialogRepository.getOtherParticipant(d.id, userId);
            return { id: d.id, created_at: d.created_at, other: other ?? undefined };
        }));
        return withOther;
    },
    async ensureParticipant(dialogId, userId) {
        return dialogRepository.isParticipant(dialogId, userId);
    },
};
