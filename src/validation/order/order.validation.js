import Joi from 'joi';

export const createOrderSchema = Joi.object({
    address: Joi.string().trim().min(5).max(200).required(),
    postalCode: Joi.string().trim().required(),
}).required();

export const OrderIdSchema = Joi.object({
    orderId: Joi.number().integer().positive().required(),
}).required();

// optional: GET /orders?status=SHIPPED&page=1&limit=10
export const orderListQuerySchema = Joi.object({
    status: Joi.string().valid('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'RETURNED', 'REFUNDED'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
});

export const updateOrderSchema = Joi.object({
    address: Joi.string().trim().min(5).max(200),
    postalCode: Joi.string().trim().pattern(/^\d{5,10}$/),
}).min(1).required();