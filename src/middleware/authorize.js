/** GET /users/:id — user: own profile + VIEW_PROFILE, or VIEW_USERS; service: VIEW_USERS from registry. */
export function authorizeGetProfile(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { id } = req.params;
  if (req.auth.kind === 'service') {
    if (req.auth.permissions.includes('VIEW_USERS')) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  }
  const isSelf = req.auth.userId === id;
  const perms = req.auth.permissions;
  if ((isSelf && perms.includes('VIEW_PROFILE')) || perms.includes('VIEW_USERS')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
}

/** PUT /users/:id — users only; self + UPDATE_PROFILE or MANAGE_USERS. */
export function authorizeUpdateProfile(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.auth.kind !== 'user') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { id } = req.params;
  const isSelf = req.auth.userId === id;
  const perms = req.auth.permissions;
  if ((isSelf && perms.includes('UPDATE_PROFILE')) || perms.includes('MANAGE_USERS')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
}

/** PUT /users/:id/role — user JWT with ASSIGN_ROLE only. */
export function authorizeAssignRole(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.auth.kind !== 'user') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (req.auth.permissions.includes('ASSIGN_ROLE')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
}

/** POST /users/batch — service: BATCH_USER_LOOKUP; user: BATCH_USER_LOOKUP, VIEW_USERS, or MANAGE_USERS. */
export function authorizeBatch(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.auth.kind === 'service') {
    if (req.auth.permissions.includes('BATCH_USER_LOOKUP')) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  }
  const perms = req.auth.permissions;
  if (
    perms.includes('BATCH_USER_LOOKUP') ||
    perms.includes('VIEW_USERS') ||
    perms.includes('MANAGE_USERS')
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
}
