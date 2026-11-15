import createError from "http-errors";
import { prismaPool } from "../../helper/helper.js";

const prisma = prismaPool;

// Fetch all product categories sorted in ascending order
export async function getCategories() {
    return await prisma.productCategory.findMany({
        orderBy: { categoryName: "asc" }
    });
}

// Fetch all active seller inventory listings with optional condition, price, and search filters
export async function getInventoryListings({ condition, minPrice, maxPrice, search } = {}) {
    const where = {
        isActive: true,
    };

    if (condition) {
        where.condition = condition;
    }
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (search) {
        where.product = {
            OR: [
                { productName: { contains: search, mode: "insensitive" } },
                { brand: { contains: search, mode: "insensitive" } },
                { model: { contains: search, mode: "insensitive" } },
            ]
        };
    }

    return await prisma.sellerInventory.findMany({
        where,
        include: {
            product: {
                select: {
                    id: true,
                    productName: true,
                    description: true,
                    rating: true,
                    model: true,
                    brand: true,
                    attributes: true,
                    images: true,
                    videos: true,
                    categories: { select: { categoryName: true } }
                }
            },
            seller: {
                select: {
                    id: true,
                    storeName: true,
                    trusted: true,
                    verified: true
                }
            }
        },
        orderBy: { id: "desc" }
    });
}

// Fetch all products with active listings, category/brand/search filters, and sorting
export async function getProducts({ search, category, brand, condition, sort } = {}) {
    const where = {};

    if (search) {
        where.OR = [
            { productName: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    if (category) {
        where.categories = {
            some: {
                categoryName: { equals: category, mode: "insensitive" }
            }
        };
    }

    if (brand) {
        where.brand = { equals: brand, mode: "insensitive" };
    }

    let orderBy = { id: "desc" };
    if (sort === "rating") {
        orderBy = { rating: "desc" };
    } else if (sort === "name") {
        orderBy = { productName: "asc" };
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            categories: { select: { categoryName: true } },
            listings: {
                where: condition ? { isActive: true, condition } : { isActive: true },
                include: {
                    seller: {
                        select: {
                            id: true,
                            storeName: true,
                            trusted: true,
                            verified: true
                        }
                    }
                },
                orderBy: { price: "asc" }
            },
            comments: {
                select: {
                    id: true,
                    rating: true,
                    like: true,
                    dislike: true,
                    massage: true,
                    createdAt: true,
                    client: {
                        select: {
                            user: { select: { userName: true } }
                        }
                    }
                },
                take: 5,
                orderBy: { createdAt: "desc" }
            }
        },
        orderBy
    });

    if (sort === "price_asc") {
        products.sort((a, b) => {
            const minA = a.listings[0]?.price ?? Infinity;
            const minB = b.listings[0]?.price ?? Infinity;
            return minA - minB;
        });
    } else if (sort === "price_desc") {
        products.sort((a, b) => {
            const maxA = a.listings[a.listings.length - 1]?.price ?? -Infinity;
            const maxB = b.listings[b.listings.length - 1]?.price ?? -Infinity;
            return maxB - maxA;
        });
    }

    return products;
}

// Fetch single product details by ID including categories, active listings, and comments
export async function getProductById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        throw createError(400, "invalid product id");
    }

    const product = await prisma.product.findUnique({
        where: { id: numericId },
        include: {
            categories: { select: { categoryName: true } },
            listings: {
                where: { isActive: true },
                include: {
                    seller: {
                        select: {
                            id: true,
                            storeName: true,
                            trusted: true,
                            verified: true
                        }
                    }
                },
                orderBy: { price: "asc" }
            },
            comments: {
                select: {
                    id: true,
                    rating: true,
                    like: true,
                    dislike: true,
                    massage: true,
                    images: true,
                    videos: true,
                    createdAt: true,
                    client: {
                        select: {
                            user: { select: { userName: true } }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            }
        }
    });

    if (!product) throw createError(404, "product not found");

    return product;
}
