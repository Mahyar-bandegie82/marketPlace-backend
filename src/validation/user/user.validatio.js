import Joi from "joi";

export const addressVal = Joi.object({
    address: Joi.string().min(5).max(100).required()
})