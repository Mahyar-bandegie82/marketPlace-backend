import express from "express";
import  userRoute from "./auth/auth.routes.js"
import cookieParser from "cookie-parser";
import {handlleError, notFound} from "../../middleware/errorMiddleWare.js";
export default function V1Loader(){
    const app = express.Router()
    app.use(notFound);                 // then these two, at the very end
    app.use(handlleError);
    app.use('/auth',cookieParser(),  userRoute)

    return app
}