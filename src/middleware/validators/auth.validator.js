export function validateRegister(req, res, next) {
  const { username, password, role } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ status: 400, message: 'username must be at least 3 characters' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ status: 400, message: 'password must be at least 6 characters' });
  }

  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ status: 400, message: 'invalid role' });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ status: 400, message: 'username and password are required' });
  }
  next();
}
