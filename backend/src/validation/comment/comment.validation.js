import Joi from 'joi';

export const ProductIdSchema = Joi.object({
    productId: Joi.number().integer().positive().required(),
}).required();

export const createCommentSchema = Joi.object({
    productId: Joi.number().integer().positive().required(),
    rating: Joi.number().min(1).max(100).required(),
    massage: Joi.string().trim().min(1).max(1000).required(),
    images: Joi.array().items(Joi.string().uri()).default([]),
    videos: Joi.array().items(Joi.string().uri()).default([]),
}).required();


export const updateCommentSchema = Joi.object({
    rating: Joi.number().min(1).max(100),
    massage: Joi.string().trim().min(1).max(1000),
    images: Joi.array().items(Joi.string().uri()),
    videos: Joi.array().items(Joi.string().uri()),
}).or('rating', 'massage', 'images', 'videos').required();