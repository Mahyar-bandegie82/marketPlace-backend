import express from "express";
import V1Loader from "./V1/index.js"

export default function routeLoader(){
    const router = express.Router();
    router.use('/V1', V1Loader())
    return router;
}