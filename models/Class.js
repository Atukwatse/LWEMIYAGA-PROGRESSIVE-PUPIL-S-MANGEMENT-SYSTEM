const mongose =require("mongoose");
const classSchema = new mongose.Schema({
    className: { type: String,
         required: true,
        unique: true},
        ClassId:{
            type: String,
            required: true,
            unique: true
        },
        classTeacher: {
            type: String,
            required: true
        },
        Capacity: {
            type: Number,
            required: true}
    },
    {timestamps: true}
);

const Class = mongoose.model("Class", classSchema);

module.exports = Class;