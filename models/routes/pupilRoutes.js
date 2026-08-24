const express = require("express");
const router = express.Router();

const Pupil = require("../models/Pupils");

router.get("/", async (req, res) => {
    try {
        const pupils = await Pupil.find();
        res.json(pupils);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;