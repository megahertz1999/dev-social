const express = require('express')
const app = express()
const connectDB = require('./config/db')

//connect app to databse
connectDB()


app.get('/', (req, res) => {
  res.send("Hello world")
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`)
})