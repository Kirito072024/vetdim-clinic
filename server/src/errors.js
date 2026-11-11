// Помилка з HTTP-статусом. Express 5 сам передає помилки з async-обробників у errorHandler.
export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не існує` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Некоректний JSON у тілі запиту
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Занадто великий запит' });
  }
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Внутрішня помилка сервера' : err.message,
    ...(err.fields && { fields: err.fields }),
  });
}
