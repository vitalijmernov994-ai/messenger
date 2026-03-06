import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = '7d';
export const authService = {
    async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    },
    async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    },
    async register(email, password, name, role = 'user') {
        const existing = await userRepository.findByEmail(email);
        if (existing)
            throw new Error('USER_EXISTS');
        const hashed = await this.hashPassword(password);
        const id = await userRepository.create(email, hashed, name, role);
        const user = {
            id,
            email,
            name,
            role,
            created_at: new Date(),
        };
        const token = this.createToken(user);
        return { user, token };
    },
    async login(email, password) {
        const found = await userRepository.findByEmail(email);
        if (!found)
            throw new Error('INVALID_CREDENTIALS');
        const ok = await this.comparePassword(password, found.password);
        if (!ok)
            throw new Error('INVALID_CREDENTIALS');
        const user = {
            id: found.id,
            email: found.email,
            name: found.name,
            role: found.role,
            created_at: found.created_at,
        };
        const token = this.createToken(user);
        return { user, token };
    },
    createToken(user) {
        return jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    },
    verifyToken(token) {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload;
    },
    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findById(userId);
        if (!user)
            throw new Error('USER_NOT_FOUND');
        const ok = await this.comparePassword(currentPassword, user.password);
        if (!ok)
            throw new Error('INVALID_PASSWORD');
        const hashed = await this.hashPassword(newPassword);
        await userRepository.updatePassword(userId, hashed);
    },
};
