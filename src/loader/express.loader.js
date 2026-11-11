import morgan from "morgan";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { handleError, notFound } from "../API/middleware/errorMiddleWare.js";
import routeLoader from "../API/routes/index.js";
import { loadSwaggerDocs } from "./loadDocs.js";   // adjust to where you put it

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// folder that holds auth.yaml, users.yaml, components.yaml
const DOCS_DIR = path.join(__dirname, "../docs");   // adjust if your folder is elsewhere

export function expressLoader(app, domain, port) {
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    const swaggerDocs = loadSwaggerDocs(DOCS_DIR, domain);

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    app.get("/api-docs.json", (req, res) => res.json(swaggerDocs));

    app.use("/api/V1", routeLoader());
    app.use(notFound);
    app.use(handleError);

    app.listen(port, () => {
        console.log(`Server is running on ${domain}`);
        console.log(`Swagger Docs available at ${domain}/api-docs`);
    });
}