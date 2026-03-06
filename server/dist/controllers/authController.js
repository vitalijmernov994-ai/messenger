import { z } from 'zod';
import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';
const registerSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(6).max(100),
    name: z.string().min(1).max(255),
    role: z.enum(['user', 'admin']).optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6).max(100),
});
export const authController = {
    async register(req, res) {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }
        const { email, password, name, role } = parsed.data;
        try {
            const result = await authService.register(email, password, name, role ?? 'user');
            res.status(201).json(result);
        }
        catch (e) {
            if (e.message === 'USER_EXISTS') {
                res.status(409).json({ error: 'User with this email already exists' });
                return;
            }
            throw e;
        }
    },
    async login(req, res) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }
        const { email, password } = parsed.data;
        try {
            const result = await authService.login(email, password);
            res.json(result);
        }
        catch (e) {
            if (e.message === 'INVALID_CREDENTIALS') {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }
            throw e;
        }
    },
    async me(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await userService.getById(req.user.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    },
    async changePassword(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
            return;
        }
        try {
            await authService.changePassword(req.user.userId, parsed.data.currentPassword, parsed.data.newPassword);
            res.json({ ok: true });
        }
        catch (e) {
            if (e.message === 'INVALID_PASSWORD') {
                res.status(401).json({ error: 'Current password is incorrect' });
                return;
            }
            throw e;
        }
    },
};
