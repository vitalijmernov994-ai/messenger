import { userRepository } from '../repositories/userRepository.js';
export const adminController = {
    async listUsers(req, res) {
        const users = await userRepository.listAll();
        res.json(users);
    },
};
