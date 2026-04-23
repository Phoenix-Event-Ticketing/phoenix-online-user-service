import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  authorizeAssignRole,
  authorizeBatch,
  authorizeGetProfile,
  authorizeListUsers,
  authorizeUpdateProfile,
} from '../middleware/authorize.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/', authenticate, authorizeListUsers, userController.listUsers);
router.post('/batch', authenticate, authorizeBatch, userController.batchLookup);

router.get('/:id', authenticate, authorizeGetProfile, userController.getProfile);
router.put('/:id', authenticate, authorizeUpdateProfile, userController.updateProfile);
router.put('/:id/role', authenticate, authorizeAssignRole, userController.assignRole);

export default router;
