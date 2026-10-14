import {PrismaClient} from '@prisma/client'
import createError from 'http-errors';

const prisma = new PrismaClient();


export async function getUserAddresses(userId) {
    return await prisma.address.findMany({
        where: {
            userId: userId,
        }
    });
}

async function getAddress(id, addressInput) {
    const addressCheck = await prisma.address.findUnique({
        where: {
            userId_country_city_addressLine_postalCode: {
                userId: id,
                country: addressInput.country,
                city: addressInput.city,
                addressLine: addressInput.addressLine,
                postalCode: addressInput.postalCode,
            }
        }
    })

    return addressCheck
}

export async function addAddress(id, addressInput) {
    const existingAddresses = await getUserAddresses(id)
    const existingAddressArray = [...existingAddresses]
    if (existingAddressArray.length >= 5) {
        throw createError(408, "maximum number of address is 5")
    }
    const checkAddress = await getAddress(id, addressInput)
    if (!checkAddress) {
        return await prisma.address.create({
            data: {
                ...addressInput,
                userId: id
            }
        })
    } else if (checkAddress) {
        throw createError(403, "address already exists")
    }
}

export async function deleteAddress(userId, input) {
    const checkAddress = await getAddress(userId, input)
    if (!checkAddress) {
        throw createError(400, "adders is not in db")
    }
    return prisma.address.delete({
        where: {
            userId_country_city_addressLine_postalCode: {
                userId,
                country: input.country,
                city: input.city,
                addressLine: input.addressLine,
                postalCode: input.postalCode,
            }
        }
    });
}

export async function editAddress(userId, current, changes) {
    const existing = await getAddress(userId, current);
    if (!existing) throw createError(404, "address not found");

    try {
        return await prisma.address.update({
            where: {id: existing.id},
            data: {
                country: changes.country,
                city: changes.city,
                addressLine: changes.addressLine,
                postalCode: changes.postalCode,
            }
        });
    } catch (err) {
        if (err.code === "P2002") throw createError(409, "address already exists");
        throw err;
    }
}

export async function makeActive(userId, address) {
    const existing = await getAddress(userId, address);
    if (!existing) throw createError(404, "address not found");

    try {
        return await prisma.address.update({
            where: {id: existing.id},
            data: {
                isActive : true
            }
        });
    } catch (err) {
        if (err.code === "P2002") throw createError(409, "address already exists");
        throw err;
    }
}

export async function createCart(userId) {
    const existingCart = await prisma.shoppingCart.findUnique({
        where: {
            userId : userId
        }
    })
    if (existingCart) throw createError(403, "cart already exists");
    return await prisma.shoppingCart.create({
        data: {userId: userId},
    })
}