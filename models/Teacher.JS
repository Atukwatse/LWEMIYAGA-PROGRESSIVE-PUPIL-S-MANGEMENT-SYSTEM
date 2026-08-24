const mongoose = require(
    "mongoose");
const TeacherSchema = new mongoose.Schema({
    teacherId: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true},

        email: {
            type: String,
            required: true , 
            unique : true
        },
        subjects: {
            type: [String],
            required: true
        },
classes: {
    type: [String],
    default: []
},
honeNumber: {
    type: String,
    required: true
    },


    password: {
    type: String,
    required: true
}
},
{
timestamps: true
});
const Teacher = mongoose.model("Teacher", teacherSchema);
module.exports = Teacher;