import express from 'express';
import createError from "http-errors";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {isAdmin} from "../../../middleware/authMiddleware.js";
import {getPendingSellers, approveSeller, rejectSeller, loginAdmin} from "../../../../services/admin/admin.services.js";
import {generateAccessToken, generateRefreshToken, validate} from "../../../../helper/helper.js";
import {adminVal} from "../../../../validation/admin/admin.validation.js";

const router = express.Router();


router.post('/login', async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const body = validate(adminVal, req.body)
    const adminlog = await loginAdmin(body)
    const refresh = generateRefreshToken(adminlog.id)
    const access =generateAccessToken(adminlog.id)
    res.cookie("refreshToken", refresh, {httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000});
    res.status(200).json({access, adminlog : adminlog})
})

router.use(accessVerification, isAdmin);

router.get('/pendingSellers', async (req, res) => {
    const requests = await getPendingSellers();
    return res.status(200).json({requests});
});

router.put('/approveSeller/:id', async (req, res) => {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId)) throw createError(400, "invalid request id");

    const seller = await approveSeller(requestId);
    return res.status(201).json({message: 'Seller approved successfully.', seller});
});

router.delete('/rejectSeller/:id', async (req, res) => {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId)) throw createError(400, "invalid request id");

    await rejectSeller(requestId);
    return res.status(200).json({message: 'Seller request rejected.'});
});
export default router;