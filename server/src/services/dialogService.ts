import { dialogRepository } from '../repositories/dialogRepository.js';

export const dialogService = {
  async getOrCreatePersonalDialog(userId: string, otherUserId: string): Promise<string> {
    return dialogRepository.findOrCreatePersonalDialog(userId, otherUserId);
  },

  async listDialogsForUser(userId: string) {
    const dialogs = await dialogRepository.findForUser(userId);
    const withOther = await Promise.all(
      dialogs.map(async (d) => {
        const other = await dialogRepository.getOtherParticipant(d.id, userId);
        return { id: d.id, created_at: d.created_at, other: other ?? undefined };
      })
    );
    return withOther;
  },

  async ensureParticipant(dialogId: string, userId: string): Promise<boolean> {
    return dialogRepository.isParticipant(dialogId, userId);
  },
};
