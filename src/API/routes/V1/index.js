import express from "express";
import  authRoute from "./auth/auth.route.js"
import userRoute from "./user/user.route.js"
import cookieParser from "cookie-parser";
import {handlleError, notFound} from "../../middleware/errorMiddleWare.js";
import sellerRoute from "./seller/seller.route.js";
import adminRoute from "./admin/admin.route.js";


export default function V1Loader(){
    const app = express.Router()
    app.use(notFound);                 // then these two, at the very end
    app.use(handlleError);
    app.use('/auth',cookieParser(),  authRoute)
    app.use('/users', handlleError, userRoute)
    app.use('/seller', sellerRoute)
    app.use('/admin', adminRoute)
    return app
}