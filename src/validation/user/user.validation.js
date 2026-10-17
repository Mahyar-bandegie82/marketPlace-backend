import Joi from "joi";

export const addressVal = Joi.object({
    addressLine: Joi.string().min(10).max(80).required(),
    postalCode: Joi.string().required(),
})

export const deleteAddressval = Joi.object({
    country: Joi.string().required(),
    city: Joi.string().required(),
    addressLine: Joi.string().min(10).max(50).required(),
    postalCode: Joi.string().required(),
})

export const editAddressVal = Joi.object({
    address: addressVal,
    changes: Joi.object({
        country: Joi.string(),
        city: Joi.string(),
        addressLine: Joi.string(),
        postalCode: Joi.string(),
    }).min(1).required(),
});


