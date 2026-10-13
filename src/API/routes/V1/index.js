import express from "express";
import  userRoute from "./auth/auth.routes.js"
import cookieParser from "cookie-parser";
export default function V1Loader(){
    const app = express.Router()
    app.use('/auth',cookieParser(),  userRoute)

    return app
}