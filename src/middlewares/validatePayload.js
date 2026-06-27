import Joi from 'joi';
import logger from '../utils/logger.js';

const webhookSchema = Joi.object({
  event_name: Joi.string().required(),
  message: Joi.object({
    message_id: Joi.string().required(),
    text: Joi.string().allow('', null),
    photo: Joi.string().optional(),
    caption: Joi.string().allow('', null).optional(),
    chat: Joi.object({
      id: Joi.string().required(),
    }).unknown(true),
  }).unknown(true).optional()
}).unknown(true);

export const validatePayload = (req, res, next) => {
  const { error } = webhookSchema.validate(req.body);
  
  if (error) {
    logger.warn({ err: error.message, body: req.body }, 'Invalid webhook payload schema');
    return res.status(400).json({ error: 'Bad Request', message: error.message });
  }

  next();
};
