import "dotenv/config";
import express from 'express'
import routeLoader from "./API/routes/index.js"
import {expressLoader} from "./loader/express.loader.js";


const app = express();

const port = process.env.PORT || 3000;
const domain = 'http://localhost:' + port;


function startServer(){
    expressLoader(app, domain, port)
}

startServer();