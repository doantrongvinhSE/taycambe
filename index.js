const express = require("express");
const dotenv = require("dotenv");
const routes = require("./src/routes");
const connectDB = require("./src/config/db");
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Mount the routes middleware
app.use(cors());    
app.use(express.json());
app.use('/', routes);

connectDB();

app.listen(port, () => {
    console.log("server is running on port: " + port)
});