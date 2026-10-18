import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {validate} from "../../../../helper/helper.js";
import {addressVal, deleteAddressval, editAddressVal} from "../../../../validation/user/user.validation.js";
import createError from "http-errors";
import {
    deleteUserAddress,
    editAddress,
    readUserAddress,
    registerAddress
} from "../../../../services/user/user.services.js";

const router = express.Router();
router.use(accessVerification)

router.put('/addAddres', async (req, res) => {
    const body = validate(addressVal, req.body, )
    const userId = req.id
    if (!body) throw createError(400, 'address validation failed');
    const address = await registerAddress(body, userId)
    res.status(201).json({message:"success", address})
})

router.get("/readAddress", async (req, res) => {
    const userId = req.id;
    const address = await readUserAddress(userId);
    res.status(200).json({message:"success", address})
})

router.delete("/deleteAddress", async (req, res) => {
    const body = validate(deleteAddressval, req.body)
    const userId = req.id;
    const updatedAddress = await deleteUserAddress(body, userId);
    res.status(200).json({message : "deleted address", updatedAddress})
})

router.put("/editAddress", async (req, res) => {
    const body = validate(editAddressVal, req.body)
    const userId = req.id;
    const updatedAddreses = await editAddress(body, userId);
    res.status(200).json({message : "edited address successfully" , updatedAddreses})
})
export default router;