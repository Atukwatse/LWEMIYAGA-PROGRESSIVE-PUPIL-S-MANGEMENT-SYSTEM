const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    messageId: {
        type: String,
        required: true,
        unique: true
    },

    sender: {
        type: String,
        required: true,
        default: "Admin"
    },

    teacherId: {
        type: String,
        required: true
    },

    teacherName: {
        type: String,
        required: true
    },

    subject: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["read", "unread"],
        default: "unread"
    },

    sentAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;