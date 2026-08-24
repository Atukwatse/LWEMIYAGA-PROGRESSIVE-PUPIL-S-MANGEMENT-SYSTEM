const mongoose = require('mongoose');
const pupilsSchema = new mongoose.Schema({
    admissionNumber: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
    type: String,
    required: true
},
lastName: {
    type: String,
    required: true
},
gender: {
    type: String,
    enum: ["Male", "Female"],
    required: true
},

dateOfBirth: {
    type: Date,
    required: true
},

class: {
    type: String,
    required: true

},
 parentName: {
        type: String,
        required: true
    },
       parentContact: {
        type: String,
        required: true
    },

    }, {
    timestamps: true
});
module.exports = Pupils;

