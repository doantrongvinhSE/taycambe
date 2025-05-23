const express = require("express");
const dotenv = require("dotenv");
const routes = require("./routes");
const connectDB = require("./config/db");
dotenv.config();

const app = express();
const port = process.env.Port || 3001;

// Mount the routes middleware
app.use(express.json());
app.use('/', routes);
// app.use(cors());    

connectDB();

app.listen(port, () => {
    console.log("server is running on port: " + port)
});