const mongoose = require('mongoose')

const IncomeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount:{
        type: Number,
        require: true
    },
    category:{
        type: String,
        require: true
    },
    desc:{
        type: String,
        require: false
    },
    creditedOn:{
        type: Date,
    },
    recoredDate:{
        type: Date,
        default: Date.now
    }

})

module.exports=mongoose.model('Income',IncomeSchema)