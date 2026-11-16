import morgan from "morgan";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { handleError, notFound } from "../API/middleware/errorMiddleWare.js";
import routeLoader from "../API/routes/index.js";
import V1Loader from "../API/routes/V1/index.js";
import { loadSwaggerDocs } from "./loadDocs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOCS_DIR = path.join(__dirname, "../docs");

// Configure middleware, documentation, routes, and start the HTTP listener
export function expressLoader(app, domain, port) {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        process.env.FRONTEND_URL,
    ].filter(Boolean);

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
    }));
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    try {
        const swaggerDocs = loadSwaggerDocs(DOCS_DIR, domain);
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
        app.get("/api-docs.json", (req, res) => res.json(swaggerDocs));
    } catch (err) {
        console.warn("Swagger initialization skipped:", err.message);
    }

    app.get("/", (req, res) => {
        res.status(200).json({
            status: "ok",
            message: "Marketplace Backend API is running",
            endpoints: {
                products: "/api/V1/products",
                categories: "/api/V1/products/categories",
                docs: "/api-docs",
            },
        });
    });

    app.use("/api", routeLoader());
    app.use("/api/V1", V1Loader());
    app.use(notFound);
    app.use(handleError);

    if (!process.env.VERCEL) {
        app.listen(port, () => {
            console.log(`Server is running on ${domain}`);
            console.log(`Swagger Docs available at ${domain}/api-docs`);
        });
    }
}
