import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/batch', userController.batchLookup);

router.get('/:id', authenticate, userController.getProfile);
router.put('/:id', authenticate, userController.updateProfile);
router.put('/:id/role', authenticate, userController.assignRole);

export default router;
