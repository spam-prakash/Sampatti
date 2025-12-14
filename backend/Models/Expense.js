const mongoose=require('mongoose')

const ExpenseSchema= new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    amount:{
        type: Number,
        require: true
    },
    category:{
        type: String,
        require: true
    },
    subCategory:{
        type: String,
        rrquire: false
    },
    desc:{
        type: String,
        require: false
    },
    debitedOn:{
        type: Date,
    },
    transactionType: {
        type: String,
        require: false
    },
    recoredDate:{
        type: Date,
        default: Date.now
    }
})

module.exports= mongoose.model('Expense', ExpenseSchema)