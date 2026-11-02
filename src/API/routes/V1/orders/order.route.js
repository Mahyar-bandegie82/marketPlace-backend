import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {joiValidator} from "../../../../helper/helper.js";
import {createOrderSchema} from "../../../../validation/order/order.validation.js";
const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

router.post("/createOrder", async (req, res) => {

})

export default router;