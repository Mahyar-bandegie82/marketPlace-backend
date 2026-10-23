import express from "express";
import {signUpForSellers} from "../../../../controllers/seller/seller.controller.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility} from "../../../middleware/casl.authorization.js"
import {authorize} from "../../../middleware/casl.authorization.js";
import {sellerSignUpSchema} from "../../../../validation/seller/seller.validation.js";

const router = express.Router();

router.use(accessVerification)
router.use(attachAbility)

router.post('/sellerSignUp',authorize('create', 'Seller'), validateJoiSchema(sellerSignUpSchema), signUpForSellers)

export default router;