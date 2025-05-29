const express = require("express");
const dotenv = require("dotenv");
const routes = require("./routes");
const connectDB = require("./config/db");
const cors = require("cors");

dotenv.config();

const app = express();
const port = process.env.Port || 3001;

// Mount the routes middleware
app.use(cors());    
app.use(express.json());
app.use('/', routes);

connectDB();

app.listen(port, () => {
    console.log("server is running on port: " + port)
});