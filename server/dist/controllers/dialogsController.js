import { z } from 'zod';
import { dialogService } from '../services/dialogService.js';
const createSchema = z.object({ otherUserId: z.string().uuid() });
export const dialogsController = {
    async list(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const dialogs = await dialogService.listDialogsForUser(userId);
        res.json(dialogs);
    },
    async getOrCreate(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }
        const dialogId = await dialogService.getOrCreatePersonalDialog(userId, parsed.data.otherUserId);
        res.json({ dialogId });
    },
};
