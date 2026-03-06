import { z } from 'zod';
import { userService } from '../services/userService.js';
const updateProfileSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().max(255).optional(),
    description: z.string().max(500).optional().nullable(),
    avatar_url: z.union([z.string().url().max(2000), z.literal('')]).optional().nullable().transform((v) => (v === '' ? undefined : v)),
});
export const usersController = {
    async list(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const list = await userService.listForDialog(userId);
        res.json(list);
    },
    async getProfile(req, res) {
        const targetId = req.params.id;
        if (!targetId) {
            res.status(400).json({ error: 'User id required' });
            return;
        }
        const profile = await userService.getPublicProfile(targetId);
        if (!profile) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(profile);
    },
    async updateProfile(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }
        const data = parsed.data;
        if (data.name === undefined && data.email === undefined && data.description === undefined && data.avatar_url === undefined) {
            res.status(400).json({ error: 'Provide name, email, description or avatar_url to update' });
            return;
        }
        try {
            const user = await userService.updateProfile(userId, data);
            res.json(user);
        }
        catch (e) {
            if (e.message === 'EMAIL_TAKEN') {
                res.status(409).json({ error: 'This email is already used' });
                return;
            }
            throw e;
        }
    },
};
