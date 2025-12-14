const connectToMongo = require('./db')
const express=require('express')

// Dynamic Port for Production/Local
const port = process.env.PORT || 8000
const app=express()

// Connect to MongoDB
connectToMongo()


app.get('/',(req,res)=>{
    res.send("Hello World!")
})
app.listen(port,()=>{
    console.log(`Website is running on http://localhost:${port}`)
})