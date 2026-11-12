import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import createError from "http-errors";
import { joiValidator} from "../../../../helper/helper.js";
import {createCommentSchema, updateCommentSchema, ProductIdSchema} from "../../../../validation/comment/comment.validation.js";
import {createComment, updateComment, deleteComment, getComments} from "../../../../services/comment/comment.service.js";

const router = express.Router();
router.use(accessVerification, attachAbility)


router.post('/createComment', authorize('create', 'Comment'), async (req, res) => {
    const body = await joiValidator(createCommentSchema, req.body);
    const comment = await createComment(req.user.client.id, body);
    return res.status(201).json({message: "comment added", comment});
});

router.patch('/updateComment/:productId', authorize('update', 'Comment'), async (req, res) => {
    const {productId} = await joiValidator(ProductIdSchema, req.params);
    const body = await joiValidator(updateCommentSchema, req.body);
    const comment = await updateComment(req.user.client.id, {...body, productId});
    return res.status(200).json({message: "comment updated", comment});
});

router.delete('/deleteComment/:productId', authorize('delete', 'Comment'), async (req, res) => {
    const {productId} = await joiValidator(ProductIdSchema, req.params);
    await deleteComment(req.user.client.id, productId);
    return res.status(200).json({message: "comment deleted"});
});

router.get('/getComments', async (req, res) => {
    if (!req.user.client) throw createError(403, "only clients have reviews");
    const comments = await getComments(req.user.client.id);
    return res.status(200).json({comments});
});

export default router;