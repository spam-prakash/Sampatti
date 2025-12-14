const mongoose= require('mongoose')

const GoalSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    title: {
        type: String,
        require: true
    },
    priorityLevel:{
        type: Number,
        require: true
    },
    targetAmount: {
        type: Number,
        require: true
    },
    category: {
        type: String,
        require: true
    },
    deadline:{
        type: Date,
        require: true
    }
})

module.exports= mongoose.model("Goal", GoalSchema)