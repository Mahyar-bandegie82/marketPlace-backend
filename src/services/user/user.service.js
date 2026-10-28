import createError from "http-errors";
import {prismaPool} from "../../helper/helper.js";

const prisma = prismaPool

export async function registerAddress(address, userId) {
    const client = await prisma.client.findUnique({where: {userId}});
    if (!client) throw createError(404, "client profile not found");
    const clientAddresesArray = [...client.Addresses]
    const clientPostalCodeArray = [...client.postalCode]
    if (client.Addresses.length >= 3 || clientPostalCodeArray.length >= 3) throw createError(409, "maximum address per user is 3");
    const does_exist = clientAddresesArray.find(clientaddress => clientaddress === address.addressLine)
    if (does_exist) throw createError(403, "address already exists");
    const postalCode_does_exist = clientPostalCodeArray.find(postalCode => postalCode === address.postalCode)
    if (postalCode_does_exist) throw createError(403, "postal code already exists");

    return await prisma.client.update({
        where: {userId},
        data: {
            Addresses: {push: address.addressLine},
            postalCode: {push: address.postalCode},
        },
    });
}

// export async function readUserAddress(userId) {
//     const user = await prisma.client.findUnique({
//         where : {userId : userId},
//     })
//     if (!user) throw createError(404, "user not found");
//     const output = []
//     const addressArray = [...user.Addresses]
//     const postalCodeArray = [...user.postalCode]
//     addressArray.forEach((address) => {
//         output.push({address: address})
//     })
//     let i = 0;
//     postalCodeArray.forEach((postalCode) => {
//         output[i].postalCode = postalCode;
//         i++;
//     })
//     return output
// }

export async function readUserAddress(userId) {
    const client = await prisma.client.findUnique({
        where: {userId},
        select: {Addresses: true, postalCode: true},
    });
    if (!client) throw createError(404, "client profile not found");

    return client.Addresses.map((address, i) => ({
        address,
        postalCode: client.postalCode[i],
    }));
}

export async function deleteUserAddress(addressBody, userId) {
    const client = await prisma.client.findUnique({
        where: {userId},
        select: {Addresses: true, postalCode: true},
    });
    if (!client) throw createError(404, "client profile not found");
    const allAddress = client.Addresses.map((address, i) => ({
        address,
        postalCode: client.postalCode[i],
    }));
    const existingAddress = allAddress.find(address => address.address === addressBody.addressLine || address.postalCode === addressBody.postalCode);
    if (!existingAddress) throw createError(403, "address doesnt exist");
    const output = allAddress.filter(address => address.postalCode !== addressBody.postalCode || address.address !== addressBody.addressLine);
    const addressesLine = [];
    const postalCode = [];
    output.forEach(address => {
        addressesLine.push(address.address);
        postalCode.push(address.postalCode);
    })
    return await prisma.client.update({
        where: {userId},
        data: {
            Addresses: addressesLine,
            postalCode: postalCode,
        }
    })
}

export async function editAddress(body, userId) {
    const {address, changes} = body;
    const client = await prisma.client.findUnique({
        where: {userId},
        select: {Addresses: true, postalCode: true},
    });
    if (!client) throw createError(404, "client profile not found");
    const index = client.Addresses.findIndex((addressLine, i) =>
        addressLine === address.addressLine && client.postalCode[i] === address.postalCode
    );
    if (index === -1) throw createError(404, "address not found");

    const newAddressLine = changes.addressLine ?? client.Addresses[index];
    const newPostalCode = changes.postalCode ?? client.postalCode[index];

    if (newAddressLine === client.Addresses[index] && newPostalCode === client.postalCode[index]) {
        throw createError(400, "no changes detected");
    }

    const duplicate = client.Addresses.some((a, i) => i !== index && a === newAddressLine) || client.postalCode.some((p, i) => i !== index && p === newPostalCode);
    if (duplicate) throw createError(409, "address or postal code already exists");

    const Addresses = [...client.Addresses];
    const postalCode = [...client.postalCode];
    Addresses[index] = newAddressLine;
    postalCode[index] = newPostalCode;

    return await prisma.client.update({
        where: {userId},
        data: {
            Addresses: Addresses,
            postalCode: postalCode
        },
        select: {Addresses: true, postalCode: true},
    })
}

export async function addFavourite(clientId, productId) {
    const product = await prisma.product.findUnique({
        where: {id: productId},
        select: {id: true},
    });
    if (!product) throw createError(404, "product not found");

    const exists = await prisma.favouriteProducts.findUnique({
        where : {clientId_productId : {clientId, productId}},
    })

    if(exists) throw createError(401, 'already exists')
    await prisma.favouriteProducts.create({data: {clientId, productId}});
}

export async function removeFavourite(clientId, productId) {
    const exists = await prisma.favouriteProducts.findUnique({
        where: { clientId_productId: { clientId, productId } },
        select: { productId: true },
    });
    if (!exists) throw createError(404, "product is not in your favourites");

    await prisma.favouriteProducts.delete({
        where: { clientId_productId: { clientId, productId } },
    });
}

export async function clearFavourites(clientId) {
    const {count} = await prisma.favouriteProducts.deleteMany({
        where: {clientId},
    });
    return count;
}

export async function getFavourites(clientId) {
    return await prisma.favouriteProducts.findMany({
        where: { clientId },
        select: {
            product: {
                select: { id: true, productName: true, rating: true, images: true },
            },
        },
        orderBy: { productId: 'desc' },
    });
}