const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const response = {
    success: false,
    error: err.message || 'Lỗi hệ thống',
  };

  if (err.field) response.field = err.field;

  if (err.name === 'CastError') {
    response.error = 'ID không hợp lệ';
    return res.status(400).json(response);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'unknown';
    response.error = `Giá trị '${field}' đã tồn tại (trùng lặp)`;
    response.field = field;
    return res.status(409).json(response);
  }

  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    response.error = messages.join('; ');
    return res.status(400).json(response);
  }

  if (status === 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
