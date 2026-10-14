import express from "express";
import  authRoute from "./auth/auth.route.js"
import userRoute from "./user/user.route.js"
import cookieParser from "cookie-parser";
import {handlleError, notFound} from "../../middleware/errorMiddleWare.js";
export default function V1Loader(){
    const app = express.Router()
    app.use(notFound);                 // then these two, at the very end
    app.use(handlleError);
    app.use('/auth',cookieParser(),  authRoute)
    app.use('/users', handlleError, userRoute)
    return app
}