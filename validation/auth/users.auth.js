import Joi from "joi";

const PHONE_REGEX = /^09\d{2} \d{3} \d{4}$/;

const PASSWORD_REGEX =
  /^(?=(?:.*[A-Z]){2})(?=.*[^A-Za-z0-9])(?=(?:.*\d){2})[\x21-\x7E]{9,72}$/;

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

const currentPassword = Joi.string().max(72)

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

/** Sign up (register a new account). */
const signUpSchema = Joi.object({
  userName: userName.required(),
  password: newPassword.required(),
  phoneNumber: phoneNumber.required(),
  email: email.required(),
});

/** Log in. */
const loginSchema = Joi.object({
  userName: userName.required(),
  password: currentPassword.required(),
  phoneNumber: phoneNumber.required(),
});




const changeCredentialsSchema = Joi.object({
  phoneNumber: phoneNumber.required(),
  changes: Joi.object({
    userName : userName,
    phoneNumber : phoneNumber,
    password: newPassword,
  }).min(1) .required().messages({
      "object.min":
        "changes must contain at least one of: userName, phoneNumber, password",
    }),
})
  .custom((value, helpers) => {
    if (
      value.changes.password !== undefined &&
      value.changes.password === value.password
    ) {
      return helpers.error("changes.samePassword");
    }
    return value;
  })
  .messages({
    "changes.samePassword": "the new password must be different from the current one",
  });

