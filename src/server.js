import "dotenv/config";
import express from 'express'
import routeLoader from "./API/routes/index.js"


const app = express();
app.use('/api', routeLoader());

const port = process.env.PORT || 3000;
const domain = 'http://localhost:' + port;


app.listen(port, () => {
    console.log(`server is running on domain ${domain}`);
})