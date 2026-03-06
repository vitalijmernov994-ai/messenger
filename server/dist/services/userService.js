import { userRepository } from '../repositories/userRepository.js';
export const userService = {
    async getById(id) {
        const row = await userRepository.findById(id);
        if (!row)
            return null;
        const r = row;
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            description: r.description ?? null,
            avatar_url: r.avatar_url ?? null,
            role: row.role,
            created_at: row.created_at,
        };
    },
    async getPublicProfile(id) {
        return userRepository.findPublicById(id);
    },
    async listForDialog(exceptUserId) {
        return userRepository.listExcept(exceptUserId);
    },
    async updateProfile(userId, data) {
        await userRepository.update(userId, data);
        const user = await this.getById(userId);
        if (!user)
            throw new Error('USER_NOT_FOUND');
        return user;
    },
};
