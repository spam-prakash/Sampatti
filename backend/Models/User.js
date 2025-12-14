const mongoose = require('mongoose')

const UserSchema=new mongoose.Schema({
    googleId:{
        type: String,
        require: false
    },
    username:{
        type: String,
        require: true
    },
    primaryMOI:{
        type: String,
        require: true
    },
    monthlyIncome:{
        type: Number,
        require: true
    },
    name:{
        type: String,
        require: true
    },
    phone:{
        type: Number,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    profilePic:{ 
        type: String,
        require: false
    },
    password:{
        type: String,
        require: false
    }
})

module.exports = mongoose.model('User', UserSchema)