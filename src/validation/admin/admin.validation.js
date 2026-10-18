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