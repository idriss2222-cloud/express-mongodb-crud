export const validateTaskPayload = (req, res, next) => {
  const { title, description, done } = req.body || {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    const err = new Error('Task title is required');
    err.statusCode = 400;
    return next(err);
  }

  if (done !== undefined && typeof done !== 'boolean') {
    const err = new Error('done must be a boolean');
    err.statusCode = 400;
    return next(err);
  }

  next();
};
