import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await authService.register({ email, password, name });
    res.status(201).json({
      userId: user.id,
      email: user.email,
      message: 'User registered successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const { id } = req.params;
    const profile = await userService.getProfile(id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const profile = await userService.updateProfile(id, { name });
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function assignRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    const profile = await userService.assignRole(id, role);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function batchLookup(req, res, next) {
  try {
    const { user_ids: userIds } = req.body;
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: 'user_ids array is required' });
    }
    const users = await userService.batchLookup(userIds);
    res.json(users);
  } catch (err) {
    next(err);
  }
}
