
import {PrismaClient} from "@prisma/client";
import createError from "http-errors";

const prisma = new PrismaClient();

// if seller doesnt have account they will be forced to login or create an account
export async function signUpSeller(userId, json) {
    const existingSeller = await prisma.sellersInProcess.findUnique({
        where: {userId : userId}
    })
    if (existingSeller) throw createError(409, "your request already exists!");
    return await prisma.sellersInProcess.create({
        data : {
            userId: userId,
            storeName: json.storeName,
        }
    })
}