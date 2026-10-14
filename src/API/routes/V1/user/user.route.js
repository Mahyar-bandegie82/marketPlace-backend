import express from 'express';
import {validate} from "../../../../helper/helper.js";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {addressVal, deleteAddressval, editAddressVal} from "../../../../validation/user/user.validation.js";
import {
    addAddress, createCart,
    deleteAddress,
    editAddress,
    getUserAddresses,
    makeActive
} from "../../../../services/user/user.services.js"
import createError from "http-errors";
import {handlleError} from "../../../middleware/errorMiddleWare.js";

const router = express.Router();
router.use(handlleError)
router.use(accessVerification)


router.post('/addAddress', async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const body = validate(addressVal, req.body);
    const id = req.id
    const address = await addAddress(id, body);
    return res.status(201).json({message: 'Address added successfully.', address});
})

router.delete('/deleteAddress', async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const body = validate(deleteAddressval, req.body);
    await deleteAddress(req.id, body);
    return res.status(200).json({message: 'Address deleted successfully.'});
})

router.put('/editAddress', async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const {address, changes} = validate(editAddressVal, req.body);
    const updated = await editAddress(req.id, address, changes);
    return res.status(200).json({message: 'Address updated successfully.', address: updated});
})

router.put('/activateAddress', async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const body = validate(addressVal, req.body);
    const activatedAddress = await makeActive(req.id, body);
    return res.status(200).json({message: 'Address updated successfully.', address: activatedAddress});

})

router.get('/getAddress', async (req, res) => {
    const addresses = await getUserAddresses(req.id)
    return res.status(200).json({addresses})
})

router.post('/createCart', async (req, res) => {
    const user = req.id;
    const cart = await createCart(user)
    return res.status(201).json({message: 'Cart created successfully.', cart})
})
export default router;