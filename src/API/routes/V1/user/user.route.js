import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {addressVal, deleteAddressval, editAddressVal} from "../../../../validation/user/user.validation.js";
import {
    deleteUserAddress,
    editAddress,
    readUserAddress,
    registerAddress
} from "../../../../services/user/user.services.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";


const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

router.put('/addAddres', validateJoiSchema(addressVal), authorize('create', 'Client'), async (req, res) => {
    const userId = req.id
    const address = await registerAddress(req.body, userId)
    res.status(201).json({message:"success", address})
})

router.get("/readAddress", authorize('read', 'client'), async (req, res) => {
    const userId = req.id;
    const address = await readUserAddress(userId);
    res.status(200).json({message:"success", address})
})

router.delete("/deleteAddress", validateJoiSchema(deleteAddressval), authorize('delete', 'Client'),  async (req, res) => {
    const userId = req.id;
    const updatedAddress = await deleteUserAddress(req.body, userId);
    res.status(200).json({message : "deleted address", updatedAddress})
})

router.put("/editAddress", validateJoiSchema(editAddressVal) , authorize('update', 'Client'), async (req, res) => {
    const userId = req.id;
    const updatedAddreses = await editAddress(req.body, userId);
    res.status(200).json({message : "edited address successfully" , updatedAddreses})
})

export default router;