// Форма зворотного зв'язку зі сторінки «Контакти»
import { Router } from 'express';
import { validateFeedback } from '../validation.js';
import { HttpError } from '../errors.js';

export const feedbackRouter = Router();

// POST /api/feedback — повідомлення лише логуються (у реальному проєкті — email адміністратору)
feedbackRouter.post('/', (req, res) => {
  const { errors, value } = validateFeedback(req.body);
  if (Object.keys(errors).length) throw new HttpError(400, 'Перевірте правильність заповнення форми', errors);
  console.log(`[feedback] ${value.name} <${value.email}>: ${value.message.slice(0, 80)}`);
  res.status(201).json({ ok: true });
});
