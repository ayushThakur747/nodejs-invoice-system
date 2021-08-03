const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();
//db connection
const mongoURL = process.env.MONGODB_URL;
mongoose.connect(mongoURL,{

        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    
})

