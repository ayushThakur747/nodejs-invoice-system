//schema for invoide
const mongoose = require('mongoose');
const validator = require('validator');
const invoiceSchema = mongoose.Schema({
    customerName:{
        type:String,
        required:true,
        trim:true
    },
    customerEmail:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){//using validator library to validate our email
                throw new Error('Email is invalid');
            }
        }
    },
    productsDetail:[{
        name:{
            type:String,
            required:true,
        },
        price:{
            type:Number,
            required:true,
        },
        tax:{
            type:Number,
            required:true,
        }
    }],
    totalAmmount:{
        type:Number,
        required:true,
    },
    totalTax:{
        type:Number,
        required:true,
    },
    invoiceBy:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    date:{
        type:Date,
        default: Date.now
    }
},{
    timestamps:true, //mongo will take care of the time when the data is created and when it is last updated
});

const InvoiceModel = mongoose.model('InvoiceModel', invoiceSchema);

module.exports = InvoiceModel
