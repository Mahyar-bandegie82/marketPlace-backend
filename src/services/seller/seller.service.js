import createError from "http-errors";
import {getProfile} from "../auth/user.auth.service.js";
import bcrypt from "bcrypt";

import {prismaPool} from "../../helper/helper.js";

const prisma = prismaPool

// if seller doesn't have account they will be forced to log in or create an account
export async function sellerSignUp(userId, body) {
    const user = await getProfile(userId);
    if (!user) throw createError(404, 'user not found')
    if (user.userName !== body.userName && user.email !== body.email) throw createError(403, 'invalid credentials')
    const password = await bcrypt.compare(body.password, user.password);
    if (!password) throw createError(403, 'invalid credentials')
    const sellerExist = await  prisma.seller.findUnique({
        where: {userId: userId},
    })
    if (sellerExist) throw createError(404, 'a profile with this information already exists')
    return await prisma.seller.create({
        data : {
            storeName : body.storeName,
            userId : userId,
        }
    })
}