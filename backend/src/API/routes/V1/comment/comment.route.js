import express from "express";
import { accessVerification, optionalAccessVerification } from "../../../middleware/authMiddleware.js";
import { attachAbility, authorize } from "../../../middleware/casl.authorization.js";
import createError from "http-errors";
import { joiValidator } from "../../../../helper/helper.js";
import { createCommentSchema, updateCommentSchema, ProductIdSchema, CommentIdSchema, reactCommentSchema } from "../../../../validation/comment/comment.validation.js";
import { createComment, updateComment, deleteComment, getComments, reactToComment } from "../../../../services/comment/comment.service.js";

const router = express.Router();

router.use(optionalAccessVerification, attachAbility);

// Retrieve all reviews submitted by the authenticated client
router.get('/getComments', async (req, res) => {
    if (!req.user?.client) throw createError(403, "only clients have reviews");
    const comments = await getComments(req.user.client.id);
    return res.status(200).json({ comments });
});

// Access verification middleware for mutating requests
router.use(accessVerification, attachAbility);

// Create a new product review and rating
router.post('/createComment', authorize('create', 'Comment'), async (req, res) => {
    const body = await joiValidator(createCommentSchema, req.body);
    const comment = await createComment(req.user.client.id, body);
    return res.status(201).json({ message: "comment added", comment });
});

// Update an existing product review and rating
router.patch('/updateComment/:productId', authorize('update', 'Comment'), async (req, res) => {
    const { productId } = await joiValidator(ProductIdSchema, req.params);
    const body = await joiValidator(updateCommentSchema, req.body);
    const comment = await updateComment(req.user.client.id, { ...body, productId });
    return res.status(200).json({ message: "comment updated", comment });
});

// Delete a client's review for a product
router.delete('/deleteComment/:productId', authorize('delete', 'Comment'), async (req, res) => {
    const { productId } = await joiValidator(ProductIdSchema, req.params);
    await deleteComment(req.user.client.id, productId);
    return res.status(200).json({ message: "comment deleted" });
});

// React (like or dislike) to a comment
router.post('/react/:commentId', authorize('react', 'Comment'), async (req, res) => {
    const { commentId } = await joiValidator(CommentIdSchema, req.params);
    const { type } = await joiValidator(reactCommentSchema, req.body);
    const comment = await reactToComment(commentId, type);
    return res.status(200).json({ message: `comment ${type}d`, comment });
});

export default router;
