import createError from 'http-errors';
import {prismaPool} from "../../helper/helper.js";

const prisma = prismaPool;

export async function createComment(clientId, body) {
    const {rating, massage, images, videos, productId} = body;
    return await prisma.$transaction(async (tx) => {
        const productExists = await tx.product.findUnique({
            where: { id: productId },
            select: { id: true }
        })
        if (!productExists) throw createError(404, "Product not found");

        const commentExists = await tx.comment.findUnique({
            where: { productId_clientId: { productId, clientId } }
        })
        if (commentExists) throw createError(400, "You have already commented on this product");

        const comment = await tx.comment.create({
            data: {
                rating,
                massage,
                images,
                videos,
                productId,
                clientId
            }
        })
        const allComments = await tx.comment.findMany({
            where: { productId: productId },
            select: {
                rating: true,
            }
        })
        const totalRating = allComments.reduce((acc, comment) => acc + comment.rating, 0);
        const averageRating = totalRating / (allComments.length);

        await tx.product.update({
            where: { id: productId },
            data: { rating: averageRating }
        })
        return comment;
    })
}

export async function updateComment(clientId, body) {
    const {rating, massage, images, videos, productId} = body;
        return await prisma.$transaction(async (tx) => {
        const productExists = await tx.product.findUnique({
            where: { id: productId },
            select: { id: true }
        })
        if (!productExists) throw createError(404, "Product not found");

        const commentExists = await tx.comment.findUnique({
            where: { productId_clientId: { productId, clientId } },
            select: {rating: true}
        })
        if (!commentExists) throw createError(400, "You have not commented on this product");

        const allComments = await tx.comment.findMany({
            where: { productId: productId },
            select: {
                rating: true,
            }
        })
        const totalRating = allComments.reduce((acc, comment) => acc + comment.rating, 0);
        
        const newRating = rating ?? commentExists.rating;
        const totalRatingMinusOldComment = totalRating - commentExists.rating;
        const newAverageRating = (totalRatingMinusOldComment + newRating) / (allComments.length);
        
        const comment = await tx.comment.update({
            where: { productId_clientId: { productId, clientId } },
            data: {
                rating: newRating,
                massage,
                images,
                videos
            },
        })

        await tx.product.update({
            where: { id: productId },
            data: { rating: newAverageRating }
        })
        return comment;
    })
}

export async function deleteComment(clientId, productId) {
    return await prisma.$transaction(async (tx) => {
        const productExists = await tx.product.findUnique({
            where: { id: productId },
            select: { id: true }
        })
        if (!productExists) throw createError(404, "Product not found");

        const commentExists = await tx.comment.findUnique({
            where: { productId_clientId: { productId, clientId } },
            select: {rating: true}
        })
        if (!commentExists) throw createError(400, "You have not commented on this product");

        const allComments = await tx.comment.findMany({
            where: { productId: productId },
            select: {
                rating: true,
            }
        })
        const totalRating = allComments.reduce((acc, comment) => acc + comment.rating, 0);
        const totalRatingMinusOldComment = totalRating - commentExists.rating;
        const newAverageRating = allComments.length > 1 ? (totalRatingMinusOldComment / (allComments.length - 1)) : 0;

        await tx.comment.delete({
            where: { productId_clientId: { productId, clientId } }
        })

        await tx.product.update({
            where: { id: productId },
            data: { rating: newAverageRating }
        })

        return "Comment deleted successfully" ;
    })
}

export async function getComments(clientId) {
    const comments = await prisma.comment.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            productId: true,
            rating: true,
            massage: true,
            images: true,
            videos: true,
            product: { select: {
                productName: true,
                rating: true,
            }}
        }
    });
    return comments;
}