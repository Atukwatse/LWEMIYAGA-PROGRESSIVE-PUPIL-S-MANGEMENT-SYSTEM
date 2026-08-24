const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const pupilRoutes = require("./routes/pupilRoutes");

const app = express();

const PORT = 5000;

// MongoDB database
const MONGO_URI = "mongodb://127.0.0.1:27017/pupils";

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// Routes
// --------------------
app.use("/api/pupils", pupilRoutes);

// --------------------
// Test route
// --------------------
app.get("/", (req, res) => {
    res.send("Lwemiyaga Pupils Management System API is running");
});

// --------------------
// Connect to MongoDB
// --------------------
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully to pupils database");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });