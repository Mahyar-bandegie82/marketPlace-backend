import express from "express";
import {signUpSchema, loginSchema, changeCredentialsSchema} from "../../../../validation/auth/users.auth.js"
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {
    editInfoRouteHandler,
    loginRouteHandler, logoutRouteHandler,
    refreshRouteHandler,
    signupRouteHandler
} from "../../../../controllers/auth/auth.controller.js";


const router = express.Router();

router.put('/refresh', refreshRouteHandler)
router.post('/signup',validateJoiSchema(signUpSchema), signupRouteHandler)
router.post('/login', validateJoiSchema(loginSchema), loginRouteHandler)
router.post('/logout', logoutRouteHandler)
router.use(accessVerification, attachAbility)
router.put('/editinfo',authorize('update', 'User'), validateJoiSchema(changeCredentialsSchema) , editInfoRouteHandler)

export default router