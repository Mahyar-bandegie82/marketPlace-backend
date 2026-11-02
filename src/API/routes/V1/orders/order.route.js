import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {joiValidator} from "../../../../helper/helper.js";
const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

export default router;