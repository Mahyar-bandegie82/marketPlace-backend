import morgan from "morgan"
import express from "express";
import {handleError, notFound} from "../API/middleware/errorMiddleWare.js";
import cookieParser from "cookie-parser";
import routeLoader from "../API/routes/index.js";

export function expressLoader(app, domain, port){
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use('/api', routeLoader())
    app.use(notFound);
    app.use(handleError);

    app.listen(port, () => {
        console.log(`Server is running on ${domain}`);
    });
}