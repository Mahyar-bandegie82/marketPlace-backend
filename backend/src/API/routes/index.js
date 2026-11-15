import express from "express";
import V1Loader from "./V1/index.js";

// Initialize and mount versioned API routes
export default function routeLoader() {
    const router = express.Router();
    router.use('/V1', V1Loader());
    return router;
}
