const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({

    studentId: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    paymentMethod: {
        type: String,
        default: "cash",
        required: true
    },

    paymentDate: {
        type: Date,
        required: true
    }

}, {
    timestamps: true
});

const Fee = mongoose.model("Fee", feeSchema);

module.exports = Fee;