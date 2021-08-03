const express = require('express');
require('./db/mongoose');
const userRoutes = require('./routes/user');//user routes
const invoiceRoutes = require('./routes/invoice');//invoice routes
const {initialilizing} = require('./controllers/users');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());


app.use('/user',userRoutes);
app.use('/invoice',invoiceRoutes);
app.get('/',initialilizing);

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`server runnig on ${PORT}`)
})