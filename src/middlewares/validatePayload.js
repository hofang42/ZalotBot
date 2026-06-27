import Joi from 'joi';
import logger from '../utils/logger.js';

// Schema cho Zalo Bot Platform Webhook payload
const payloadSchema = Joi.object({
  update_id: Joi.number().optional(),
  message: Joi.object({
    message_id: Joi.string().required(),
    from: Joi.object().optional(),
    chat: Joi.object({
      id: Joi.string().required()
    }).required(),
    date: Joi.number().optional(),
    text: Joi.string().optional()
  }).unknown(true).optional()
}).unknown(true);

export const validatePayload = (req, res, next) => {
  const { error } = payloadSchema.validate(req.body);
  
  if (error) {
    logger.warn({ err: error.details, body: req.body }, 'Invalid webhook payload');
    return res.status(400).json({ error: 'Bad Request', details: error.details });
  }

  next();
};
