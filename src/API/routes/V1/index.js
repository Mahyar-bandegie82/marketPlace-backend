import express from "express";
import cookieParser from "cookie-parser";
import authRoute from "./auth/auth.route.js";
import userRoute from "./user/user.route.js";
import sellerRoute from "./seller/seller.route.js";
import adminRoute from "./admin/admin.route.js";
import {handleError, notFound} from "../../middleware/errorMiddleWare.js";

export default function V1Loader() {
    const router = express.Router();

    router.use(express.json());
    router.use(cookieParser());

    router.use("/auth", authRoute);
    router.use("/users", userRoute);
    router.use("/seller", sellerRoute);
    router.use("/admin", adminRoute);

    router.use(notFound);
    router.use(handleError);

    return router;
}