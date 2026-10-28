import Joi from "joi";

const PHONE_REGEX = /^09\d{9}$/;;
const PASSWORD_REGEX = /^(?=(?:.*[A-Z]){2})(?=.*[^A-Za-z0-9])(?=(?:.*\d){2})[\x21-\x7E]{9,72}$/;
const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,30}$/;

const userName = Joi.string()
    .trim()
    .min(4)
    .max(20)
    .pattern(USERNAME_REGEX)
    .messages({
        "string.pattern.base":
            "userName must be 3-30 characters: letters, numbers, '_', '.' or '-'",
    });

const phoneNumber = Joi.string()
    .trim()
    .pattern(PHONE_REGEX)
    .messages({
        "string.pattern.base": "phoneNumber must look like 0918 885 1694",
    });

const email = Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(254)
    .messages({
        "string.email": "email is not a valid email address",
    });

const newPassword = Joi.string()
    .pattern(PASSWORD_REGEX)
    .messages({
        "string.pattern.base":
            "password must be 9-72 characters with at least 2 capital letters, 2 numbers and 1 special character (e.g. @), and no spaces",
    });

export const sellerSignUpSchema = Joi.object({
    userName: userName.required(),
    password: newPassword.required(),
    email: email.required(),
    storeName: Joi.string().required(),
});

const productSchema = Joi.object({
    productName: Joi.string().trim().min(2).required(),
    description: Joi.string().trim().required(),
    categories: Joi.array().items(Joi.string()).min(1).required(),
    attributes: Joi.object().default({}),
    images: Joi.array().items(Joi.string().uri()).default([]),
    videos: Joi.array().items(Joi.string().uri()).default([]),
});

export const addInventorySchema = Joi.object({
    productId: Joi.number().integer().positive(),
    product: productSchema,
    quantity: Joi.number().integer().min(0).required(),
    price: Joi.number().integer().positive().required(),
    condition: Joi.string().valid('NEW', 'USED', 'BARELY_USED'),
    productWaranty: Joi.object(),
}).xor('productId', 'product');

export const ListingIdSchema = Joi.object({
    listingId: Joi.number().integer().positive().required()
})

export const updateListingSchema = Joi.object({
    quantity: Joi.number().integer().min(0),
    price: Joi.number().positive(),
    condition: Joi.string().valid('NEW', 'USED'),  // use your enum values
}).min(1);