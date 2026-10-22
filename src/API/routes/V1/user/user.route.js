import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {addressVal, deleteAddressval, editAddressVal} from "../../../../validation/user/user.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {
    addAddressRouteHandler,
    deleteAddressRouteHandler, editAddressRouteHandler,
    readAddressRouteHandler
} from "../../../../controllers/user/user.controller.js";


const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

router.put('/addAddres', validateJoiSchema(addressVal), authorize('create', 'Client'), addAddressRouteHandler)
router.get("/readAddress", authorize('read', 'client'), readAddressRouteHandler)
router.delete("/deleteAddress", validateJoiSchema(deleteAddressval), authorize('delete', 'Client'), deleteAddressRouteHandler)
router.put("/editAddress", validateJoiSchema(editAddressVal) , authorize('update', 'Client'), editAddressRouteHandler)

export default router;