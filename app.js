const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const routes = require("./src/routes");
const connectDB = require("./src/config/db");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

// Mount the routes middleware
app.use(cors());    
app.use(express.json());

app.get("/healthz", (req, res) => res.send("ok"));

app.use('/', routes);

connectDB();

app.listen(port, () => {
    console.log("server is running on port: " + port)
});

module.exports = app;