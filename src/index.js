const express = require('express');
require('./db/mongoose');
const logger = require('./util/logger');
const userRoutes = require('./routes/user');//user routes
const invoiceRoutes = require('./routes/invoice');//invoice routes
const {initialilizing} = require('./controllers/users');
const pdf = require('html-pdf');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

app.set('view engine','ejs');

app.use('/user',userRoutes);
app.use('/invoice',invoiceRoutes);
app.get('/',initialilizing);

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`server runnig on ${PORT}`)
    logger.log('info',`server runnig on ${PORT}`)
})