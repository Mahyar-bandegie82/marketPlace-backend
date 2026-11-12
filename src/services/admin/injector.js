import { prismaPool } from "../../helper/helper.js";
import { hashPassword } from "../../helper/helper.js";
import {
    user,
    addressList,
    product,
    sellerInventory,
    seller,
    ProductCategory
} from "./data.js"

const prisma = prismaPool

async function makeAdmin(userId) {
    const user = await prisma.admin.create({
        data: { userId: userId }
    })
    if (!user) { throw createError(400, 'somthing went wrong.'); }
    return user;
}

async function generateFakeUser() {
    try {
        const data = [];

        for (let i = 0; i < user.length; i++) {
            const hashedPassword = await hashPassword(user[i].password, 10);

            data.push({
                userName: user[i].userName,
                password: hashedPassword,
                phoneNumber: user[i].phoneNumber,
                email: user[i].email,
                otpVerified: user[i].otpVerified,
            });
        }

        return prisma.$transaction(async (tx) => {
            const result = await tx.user.createMany({
                data,
                skipDuplicates: true,
            });
            return result
        })

        console.log(`Successfully injected ${result.count} users.`);
    } catch (error) {
        console.error("Error injecting fake users:", error);
    }
}
console.log(await generateFakeUser());

async function generateClientProfile() {
    return prisma.$transaction(async (tx) => {
        const users = await tx.user.findMany({
            select: { id: true },
            orderBy: { id: "asc" },
        });

        const data = [];

        for (let i = 0; i < users.length; i++) {
            if (!addressList[i]) break;

            data.push({
                userId: users[i].id,
                Addresses: [addressList[i].address],
                postalCode: [addressList[i].postalCode],
            });
        }

        return tx.client.createMany({
            data,
            skipDuplicates: true,
        });
    });
}

async function genProduct() {
    return await prisma.product.createMany({
        data: product.map((prod) => ({
            productName: prod.productName,
            description: prod.description,
            rating: prod.rating,
            model: prod.model,
            brand: prod.brand
        }))
    })
}
async function makeSeller() {
    return prisma.seller.createMany({
        data: seller
    });
}
async function makeSellerInventory() {
    return prisma.sellerInventory.createMany({
        data: sellerInventory,
        skipDuplicates: true,
    });
}
async function makeShoppingCart() {
    const users = await prisma.client.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
    });
    let ids = [...users]
    return await prisma.shoppingCart.createMany({
        data: ids.map((id) => {
            return {
                clientId : id.id
            }
        })
    })
}

async function makeCategory() {
    return await prisma.productCategory.createMany({
        data : ProductCategory
    })
}
makeAdmin(31)
    .then((result) => console.log(`Created ${result.count} listings.`))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
