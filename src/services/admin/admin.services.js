import {PrismaClient} from '@prisma/client'
import createError from 'http-errors';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// export async function getPendingSellers() {
//     const request = await prisma.sellersInProcess.findMany();
//     const array = []
//     for(let i = 0; request.length > i; i++){
//         const user = await prisma.user.findUnique({
//             where: {id : request[i].userId}
//         })
//         const obj = {
//             id: request[i].id,
//             storeName: request[i].storeName,
//             userId: request[i].userId,
//             user : {
//                 id : user.id,
//                 userName : user.userName,
//                 phoneNumber : user.phoneNumber,
//                 email : user.email
//             }
//         }
//         array.push(obj)
//     }
//
//     return array;
// }

export async function getPendingSellers() {
    return prisma.sellersInProcess.findMany({
        include: {
            user: {select: {id: true, userName: true, email: true, phoneNumber: true}}
        }
    });
}

export async function approveSeller(requestId) {
    // transaction: either both steps happen or neither does
    return prisma.$transaction(async (tx) => {
        const request = await tx.sellersInProcess.findUnique({where: {id: requestId}});
        if (!request) throw createError(404, "seller request not found");

        const alreadySeller = await tx.seller.findUnique({where: {userId: request.userId}});
        if (alreadySeller) throw createError(409, "this user is already a seller");

        const seller = await tx.seller.create({
            data: {
                userId: request.userId,
                storeName: request.storeName,
            }
        });

        await tx.sellersInProcess.delete({where: {id: requestId}});
        return seller;
    });
}

export async function rejectSeller(requestId) {
    const request = await prisma.sellersInProcess.findUnique({where: {id: requestId}});
    if (!request) throw createError(404, "seller request not found");

    await prisma.sellersInProcess.delete({where: {id: requestId}});
}

export async function loginAdmin(json) {
    const existingAdmin = await prisma.user.findUnique({
        where: {phoneNumber: json.phoneNumber}
    })
    const password = await bcrypt.compare(json.password, existingAdmin.password)
    if (!existingAdmin || !password || existingAdmin.userName !== json.userName) {
        throw createError(403, "admin creds untrue");
    }

    return existingAdmin;
}

// async function createAdmin(){
//     try {
//         const password = await bcrypt.hash('@AdmiN8213', 10)
//         await prisma.user.create({
//             data : {
//                 userName: "admin",
//                 password: password,
//                 phoneNumber: "09873981234",
//                 email : "mahyarrad1383@gmail.com",
//                 role: "ADMIN"
//             }
//         })
//     }
//     catch (error) {
//         console.log(error);
//     }
// }
//
// createAdmin()
//     .catch((e) => { console.error(e); process.exit(1); })