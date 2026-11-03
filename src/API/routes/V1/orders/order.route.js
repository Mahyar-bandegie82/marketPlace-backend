import express from "express";
import { accessVerification } from "../../../middleware/authMiddleware.js";
import { attachAbility, authorize } from "../../../middleware/casl.authorization.js";
import { joiValidator } from "../../../../helper/helper.js";
import { createOrderSchema , OrderIdSchema, updateOrderSchema} from "../../../../validation/order/order.validation.js";
import createError from "http-errors";
import {createOrder, cancelOrder, updateProcessingOrder, getActiveOrders} from "../../../../services/order/order.service.js";
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
router.put("/cancelOrder/:orderId", authorize("update" , "Order"), async (req, res) => {
    const orderIdValidated = await joiValidator(OrderIdSchema, req.params)
    const userId = req.id;
    const order = await cancelOrder(userId, orderIdValidated.orderId);
    res.status(200).json(order);
})

router.patch("/updateOrderAddress/:orderId", authorize("update" , "Order"), async (req, res) => {
    const {orderId} = await joiValidator(OrderIdSchema, req.params);
    const {postalCode, address} = await joiValidator(updateOrderSchema, req.body);
    const userId = req.id;
    const order = await updateProcessingOrder(userId, orderId, { postalCode, address });
    res.status(200).json(order);
})

router.get("/getOrders", authorize("read" , "Order"), async (req, res) => {
    const orderList = await getActiveOrders(req.id);
    res.status(200).json({ orders: orderList , message: "orders fetched successfully"});
})
export default router;