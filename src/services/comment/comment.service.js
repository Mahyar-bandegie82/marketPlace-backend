import createError from 'http-errors';
import {prismaPool} from "../../helper/helper.js";

const prisma = prismaPool;

export async function createComment(commentData) {
    return await prisma.$transaction(async (tx) =>{
        const comment =await tx.comment.create({})
    })
}