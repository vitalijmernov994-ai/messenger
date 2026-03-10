import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { authController } from '../controllers/authController.js';
import { usersController } from '../controllers/usersController.js';
import { dialogsController } from '../controllers/dialogsController.js';
import { messagesController } from '../controllers/messagesController.js';
import { adminController } from '../controllers/adminController.js';
import { contactController } from '../controllers/contactController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `avatar_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

const messageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `msg_${Date.now()}_${Math.random().toString(36).slice(2)}${ext || '.bin'}`);
  },
});

const uploadMessage = multer({
  storage: messageStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mime = file.mimetype || '';
    if (mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')) {
      cb(null, true);
      return;
    }
    // разрешаем и другие типы как “файлы”
    cb(null, true);
  },
});

const api = Router();

api.post('/auth/register', authController.register.bind(authController));
api.post('/auth/login', authController.login.bind(authController));

api.use(authMiddleware);

api.get('/auth/me', authController.me.bind(authController));
api.post('/users/me/avatar', uploadAvatar.single('avatar'), usersController.uploadAvatar.bind(usersController));
api.patch('/users/me', usersController.updateProfile.bind(usersController));
api.get('/users/:id', usersController.getProfile.bind(usersController));
api.post('/auth/change-password', authController.changePassword.bind(authController));
api.get('/admin/users', adminOnly, adminController.listUsers.bind(adminController));
api.get('/admin/banned-emails', adminOnly, adminController.listBanned.bind(adminController));
api.post('/admin/banned-emails', adminOnly, adminController.banEmail.bind(adminController));
api.delete('/admin/banned-emails/:email', adminOnly, adminController.unbanEmail.bind(adminController));
api.get('/users', usersController.list.bind(usersController));
api.get('/contacts', contactController.list.bind(contactController));
api.post('/contacts', contactController.add.bind(contactController));
api.delete('/contacts/:contactId', contactController.remove.bind(contactController));
api.patch('/contacts/:contactId', contactController.update.bind(contactController));
api.get('/contacts/:contactId/check', contactController.check.bind(contactController));

api.get('/dialogs', dialogsController.list.bind(dialogsController));
api.post('/dialogs', dialogsController.getOrCreate.bind(dialogsController));
api.get('/dialogs/:dialogId/messages', messagesController.list.bind(messagesController));
api.post('/dialogs/:dialogId/messages', messagesController.send.bind(messagesController));
api.post('/dialogs/:dialogId/media', uploadMessage.single('file'), messagesController.sendMedia.bind(messagesController));

export { api };
