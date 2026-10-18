import Joi from "joi";

export const addressVal = Joi.object({
    addressLine: Joi.string().min(10).max(80).required(),
    postalCode: Joi.string().required(),
})

export const deleteAddressval = Joi.object({
    addressLine: Joi.string().min(10).max(50).required(),
    postalCode: Joi.string().required(),
})

export const editAddressVal = Joi.object({
    address: addressVal,
    changes: Joi.object({
        addressLine: Joi.string(),
        postalCode: Joi.string(),
    }).min(1).required(),
});


