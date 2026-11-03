import express from "express";
import { accessVerification } from "../../../middleware/authMiddleware.js";
import { attachAbility, authorize } from "../../../middleware/casl.authorization.js";
import { joiValidator } from "../../../../helper/helper.js";
import { createOrderSchema } from "../../../../validation/order/order.validation.js";
import createError from "http-errors";
import {createOrder} from "../../../../services/order/order.service.js";
const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

router.post("/createOrder",authorize("create" , "Order"), async (req, res) => {
    if (!req.body) throw createError(405, "body is missing")
    const body = await joiValidator(createOrderSchema, req.body)
    const userId = req.id;
    const order = await createOrder(userId, body);
    res.status(201).json(order);
})

export default router;