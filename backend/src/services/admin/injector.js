import { prismaPool, hashPassword } from "../../helper/helper.js";
import {
    user,
    addressList,
    product,
    sellerInventory,
    seller,
    ProductCategory,
    cartItem,
    FavouriteProducts,
    order,
    OrderItems,
    comment,
} from "./data.js";

const prisma = prismaPool;

function getCategoriesForProductIndex(idx) {
    // idx is 1-based product index (1..60)
    if (idx >= 1 && idx <= 5) return ["graphics cards", "gaming"];
    if (idx >= 6 && idx <= 9) return ["processors", "gaming"];
    if (idx >= 10 && idx <= 11) return ["motherboards", "gaming"];
    if (idx >= 12 && idx <= 13) return ["memory", "gaming"];
    if (idx >= 14 && idx <= 16) return ["storage"];
    if (idx === 17) return ["power supplies"];
    if (idx >= 40 && idx <= 44) return ["gaming peripherals", "gaming"];
    if (idx >= 45 && idx <= 49) return ["gaming monitors", "gaming"];
    return ["gaming"];
}

export async function injectOnlineDatabase({ force = false } = {}) {
    const existingProductCount = await prisma.product.count();
    if (existingProductCount >= 50 && !force) {
        console.log(`Database already has ${existingProductCount} products. Ensuring admin accounts exist...`);
        const mahyar = await prisma.user.findUnique({ where: { phoneNumber: "09999002985" } });
        if (mahyar) {
            await prisma.user.update({ where: { id: mahyar.id }, data: { otpVerified: true } });
            await prisma.admin.upsert({
                where: { userId: mahyar.id },
                update: {},
                create: { userId: mahyar.id },
            });
        }
        return { skipped: true, existingProductCount };
    }

    console.log("Resetting tables and injecting full dataset from data.js into online DB...");

    // Clean existing rows in reverse foreign-key order and restart identity sequences at 1
    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
            "PromotionListing",
            "Promotions",
            "Comment",
            "OrderItems",
            "Order",
            "FavouriteProducts",
            "CartItem",
            "SellerInventory",
            "ShoppingCart",
            "Seller",
            "Admin",
            "Client",
            "Product",
            "ProductCategory",
            "User"
        RESTART IDENTITY CASCADE;
    `);

    // 1. Users (IDs 1..31)
    console.log("1/11 Hashing passwords and inserting 31 users...");
    const hashedPasswordCache = new Map();
    const usersData = [];
    for (let i = 0; i < user.length; i++) {
        const rawPwd = user[i].password;
        if (!hashedPasswordCache.has(rawPwd)) {
            hashedPasswordCache.set(rawPwd, await hashPassword(rawPwd));
        }
        usersData.push({
            userName: user[i].userName,
            password: hashedPasswordCache.get(rawPwd),
            phoneNumber: user[i].phoneNumber,
            email: user[i].email.toLowerCase(),
            otpVerified: i === 0 || i === 30 ? true : user[i].otpVerified,
        });
    }
    await prisma.user.createMany({ data: usersData, skipDuplicates: true });

    // 2. Make User #1 (mahyarBandegie) and User #31 Verified Admins
    console.log("2/11 Creating Admin records for userId 1 (mahyarBandegie) and userId 31...");
    await prisma.admin.createMany({
        data: [{ userId: 1 }, { userId: 31 }],
        skipDuplicates: true,
    });

    // 3. Client profiles (IDs 1..31) with addresses
    console.log("3/11 Creating 31 Client profiles with addresses...");
    const createdUsers = await prisma.user.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
    });
    const clientsData = createdUsers.map((u, i) => ({
        userId: u.id,
        Addresses: addressList[i] ? [addressList[i].address] : [],
        postalCode: addressList[i] ? [addressList[i].postalCode] : [],
        loyalCustomer: i < 5,
        amountSpent: (i + 1) * 450000,
    }));
    await prisma.client.createMany({ data: clientsData, skipDuplicates: true });

    // 4. Shopping carts (IDs 1..31)
    console.log("4/11 Creating 31 ShoppingCarts...");
    const createdClients = await prisma.client.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
    });
    await prisma.shoppingCart.createMany({
        data: createdClients.map((c) => ({ clientId: c.id })),
        skipDuplicates: true,
    });

    // 5. Product categories (11 categories)
    console.log("5/11 Creating ProductCategories...");
    await prisma.productCategory.createMany({
        data: ProductCategory,
        skipDuplicates: true,
    });

    // 6. Products (IDs 1..60) connected to categories
    console.log("6/11 Creating 60 Products and linking categories...");
    for (let i = 0; i < product.length; i++) {
        const prod = product[i];
        const catNames = getCategoriesForProductIndex(i + 1);
        await prisma.product.create({
            data: {
                productName: prod.productName,
                description: prod.description,
                rating: prod.rating,
                model: prod.model,
                brand: prod.brand,
                categories: {
                    connect: catNames.map((categoryName) => ({ categoryName })),
                },
            },
        });
    }

    // 7. Sellers (IDs 1..10)
    console.log("7/11 Creating 10 Sellers...");
    await prisma.seller.createMany({
        data: seller,
        skipDuplicates: true,
    });

    // 8. SellerInventory listings (IDs 1..120)
    console.log("8/11 Creating 120 SellerInventory listings...");
    await prisma.sellerInventory.createMany({
        data: sellerInventory,
        skipDuplicates: true,
    });

    // 9. CartItems & FavouriteProducts
    console.log("9/11 Creating CartItems and FavouriteProducts...");
    await prisma.cartItem.createMany({
        data: cartItem,
        skipDuplicates: true,
    });
    await prisma.favouriteProducts.createMany({
        data: FavouriteProducts,
        skipDuplicates: true,
    });

    // 10. Orders (IDs 1..20) & OrderItems
    console.log("10/11 Creating 20 Orders and OrderItems...");
    const statuses = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELED", "RETURNED", "REFUNDED"];
    await prisma.order.createMany({
        data: order.map((ord, idx) => ({
            ...ord,
            orderStatus: statuses[idx % statuses.length],
        })),
        skipDuplicates: true,
    });
    await prisma.orderItems.createMany({
        data: OrderItems,
        skipDuplicates: true,
    });

    // 11. Comments
    console.log("11/11 Creating 30 Product Comments...");
    await prisma.comment.createMany({
        data: comment,
        skipDuplicates: true,
    });

    console.log("✅ Online database injection complete!");
    return {
        injected: true,
        users: user.length,
        products: product.length,
        listings: sellerInventory.length,
        orders: order.length,
        comments: comment.length,
        adminCredentials: {
            userName: user[0].userName,
            phoneNumber: user[0].phoneNumber,
            password: user[0].password,
            email: user[0].email,
        },
    };
}

// Run directly when executed via `node src/services/admin/injector.js`
if (process.argv[1] && process.argv[1].includes("injector.js")) {
    injectOnlineDatabase({ force: true })
        .then((res) => console.log("Result:", res))
        .catch((err) => {
            console.error("Injection failed:", err);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}
