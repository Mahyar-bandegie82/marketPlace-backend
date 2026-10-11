import express from "express";
import  userRoute from "./auth/auth.routes.js"

export default function V1Loader(){
    const app = express.Router()
    app.use('/auth',  userRoute)

    return app
}