import express from "express";
import { accessVerification, optionalAccessVerification } from "../../../middleware/authMiddleware.js";
import { attachAbility } from "../../../middleware/casl.authorization.js";
import {
    getCategories,
    getInventoryListings,
    getProducts,
    getProductById
} from "../../../../services/product/product.service.js";

const router = express.Router();

router.use(optionalAccessVerification, attachAbility);

// Retrieve all product categories
router.get("/categories", async (req, res, next) => {
    try {
        const categories = await getCategories();
        res.status(200).json({ categories });
    } catch (err) {
        next(err);
    }
});

// Retrieve all active seller inventory listings with optional filtering
router.get("/inventory", async (req, res, next) => {
    try {
        const listings = await getInventoryListings(req.query);
        res.status(200).json({ listings });
    } catch (err) {
        next(err);
    }
});

// Retrieve all products with active listings, filtering, and sorting
router.get("/", async (req, res, next) => {
    try {
        const products = await getProducts(req.query);
        res.status(200).json({ products });
    } catch (err) {
        next(err);
    }
});

// Retrieve single product details by id
router.get("/:id", async (req, res, next) => {
    try {
        const product = await getProductById(req.params.id);
        res.status(200).json({ product });
    } catch (err) {
        next(err);
    }
});

// Access middleware for mutating requests
router.use(accessVerification, attachAbility);

export default router;
