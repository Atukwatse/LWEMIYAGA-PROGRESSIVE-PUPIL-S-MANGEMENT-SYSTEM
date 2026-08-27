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

modul// GET all pupils
router.get("/", async (req, res) => {
    try {
        const pupils = await Pupil.find();
        res.json(pupils);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// ADD a pupil
router.post("/", async (req, res) => {
    try {
        const newPupil = new Pupil(req.body);

        const savedPupil = await newPupil.save();

        res.status(201).json(savedPupil);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

module.exports = router;e.exports = router;