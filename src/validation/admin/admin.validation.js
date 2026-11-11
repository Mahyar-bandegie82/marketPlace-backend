import Joi from "joi";

const PHONE_REGEX = /^09\d{9}$/;;
const PASSWORD_REGEX = /^(?=(?:.*[A-Z]){2})(?=.*[^A-Za-z0-9])(?=(?:.*\d){2})[\x21-\x7E]{9,72}$/;
const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,30}$/;

export const adminVal = Joi.object({
    userName: Joi.string().pattern(USERNAME_REGEX).required(),
    password: Joi.string().pattern(PASSWORD_REGEX).required(),
    phoneNumber: Joi.string().pattern(PHONE_REGEX).required(),
    email: Joi.string().required(),
})

export const SellerParamsSchema = Joi.object({
    userId: Joi.number().integer().positive().required(),
});

export const addProductCategory = Joi.object({
    categoryName: Joi.string().trim().required(),
})

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'RETURNED', 'REFUNDED').required(),
});

export const paginationQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

export const highSpenderQuerySchema = Joi.object({
    minAmount: Joi.number().min(0).required(),
});

export const limitQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
});

export const idParamSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

export const productIdParamSchema = Joi.object({
    productId: Joi.number().integer().positive().required(),
});