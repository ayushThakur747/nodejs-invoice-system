const InvoiceModel =  require('../db/Models Schema/invoice');
const logger = require('../util/logger');
const {ROLE} = require('../userRoles/roles');
const generatePDF = require('../util/generatePDF');
const ObjectID = require('mongodb').ObjectID;
const responseHandler = require('../util/responseHandler')
const {sendInvoiceEmail} = require('../util/email');
const dotenv = require('dotenv');
dotenv.config();
const generateInvoice = async (req,res)=>{
    const { customerName,
            customerEmail,
            productsDetail,
        } = req.body;

    try {
        
        var  totalAmmount=0,totalTax=0;
        productsDetail.forEach((product)=>{
            totalAmmount+=product.price;
            product.tax = product.price * 0.10; //10%
            totalTax+=product.tax;
        })
        const newInvoice = new InvoiceModel({customerName,customerEmail,productsDetail,totalAmmount,totalTax,invoiceBy:req.user._id});
        const newInvoiceSaved = await newInvoice.save();  
        //generate pdf 
        res.render("invoicePdf.ejs",{data:newInvoiceSaved},function(err,html){   //error in renderring ejs
            generatePDF(html);
        });
        //send email with invoic.pdf from uilt->generatedpdf
        sendInvoiceEmail(customerName,customerEmail,)
        logger.log('info',`invoice generated,  `); 
        return responseHandler(res,200,null,newInvoiceSaved);  
    } catch (error) {
        console.log(error)
        //res.status(500).send(error.message);
        logger.log('info',`error 500 at generateInvoice  `); 
        return responseHandler(res,500,error,null);
    }
}

//update invoice 
//invoice can only be updated by superadmin admin or cashier who made it
const updateInvoice = async(req,res)=>{ //some problem
    const{id} = req.params;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['customerName','customerEmail','productsDetail'];
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if(!isValidOperation) return res.status(404).send({error:'Invalid updates'})
    
    try{
        let invoiceDB = await InvoiceModel.find({_id:id}); //from data base doument comes out as an array 
        let invoice = invoiceDB[0];

        if(req.user.id!==invoice.invoiceBy && req.user.role!==ROLE.SUPERADMIN && req.user.role!==ROLE.ADMIN){
            throw new Error("user not allowed for this action")
        }

        if(!invoice){
            //return res.status(404).send({message:"invoice not found"});
            throw new Error("invoice not found")
        }
        let  totalAmmount=0,totalTax=0;
        updates.forEach((update)=>{
            if(update === 'productsDetail'){
                invoice['productsDetail'] = req.body['productsDetail']
                invoice['productsDetail'].forEach((product)=>{
                    totalAmmount+=product.price;
                    product.tax = product.price * 0.10; //10%
                    totalTax+=product.tax;
                })  
                invoice['totalAmmount'] = totalAmmount;
                invoice['totalTax'] = totalTax;
            }else{
                invoice[update]=req.body[update]
            }
            
        });   
        await InvoiceModel.update(
            {"_id":ObjectID(invoiceDB[0].id)},
            {$set:{
                "customerName":invoice.customerName,
                "customerEmail":invoice.customerEmail,
                "productsDetail":invoice.productsDetail,
                "totalAmmount":invoice.totalAmmount,
                "totalTax":invoice.totalTax
            }}
        )
        logger.log('info',`success response 200 at updateInvoice`); 
        return responseHandler(res,200,null,invoice);
    }catch(error){
        console.log(error)
        //res.status(500).send({message:"something went wrong"});
        logger.log('info',`error response 500 at updateInvoice`); ;
        return responseHandler(res,500,error,null);
    }

}


///all?page=..&size=.. (pagination)
//pagination done filtering remaining
//for sort (ex: ?sortBy=createdAt:desc (asc for ascending desc for decending))
//get all tasks(?date=...&invoiceBy=...) //*filtering
const allInvoice =async (req,res)=>{
    let{page,size} = req.query;//pagination
    page = page?page:1;
    size = size?size:2;
    const limit = parseInt(size);
    const skip = (page-1)*size;

    const sort = req.query.sortBy==='desc'?-1:1;//sorting

    //filtering /***********filtering with date is left */
    const{date,invoiceBy} = req.query;
    const match = {};
    match.createdAt = date?date:null;
    match.invoiceBy = invoiceBy?invoiceBy:null;
    try {
        let invoiceList = {};
        if(req.user.role === ROLE.CASHIER){
            invoiceList = await InvoiceModel.find({invoiceBy:req.user._id,
                                                    date:{
                                                        $gte: ISODate(match.createdAt),
                                                        //$lt:  ISODate(match.createdAt)
                                                    }})
                                                    .limit(limit)
                                                    .skip(skip)
                                                    .sort({createdAt:sort});
        }else{
            invoiceList = await InvoiceModel.find({invoiceBy:invoiceBy,
                                                    date:{
                                                        $gte: new Date(match.createdAt),
                                                        //$lt:  ISODate(match.createdAt)
                                                    }
                                                })
                                                .limit(limit)
                                                .skip(skip)
                                                .sort({createdAt:sort});
        }
        //res.status(200).send(invoiceList);
        logger.log('info',`response 200 at allInvoice  `); 
        return responseHandler(res,200,null,invoiceList);
    } catch (error) {
        console.log(error)
        //res.status(500).send({message:"somthing went wrong!"});
        logger.log('info',`error response 500 at allInvoice`); 
        return responseHandler(res,500,error,null);
    }
}

//?date..(total sales on that day)
const salesReport = async(req,res)=>{
    let {id,date} = req.query;
    console.log(new Date(date));
    let totalsale = 0;
    try {
        let invoices;
        if(req.user.role === ROLE.CASHIER){
            if(id){
                invoices = await InvoiceModel.find({invoiceBy:req.user.id,invoiceBy:id});
            }else {
                invoices = await InvoiceModel.find({invoiceBy:req.user.id});
            }
        }else{
            if(id){
                invoices = await InvoiceModel.find({invoiceBy:id});
            }else {
                invoices = await InvoiceModel.find();
            }
        }
        
        invoices.forEach((invoice)=>{
            totalsale += invoice.totalAmmount;
        })
        //res.status(200).send({totalsale})
        logger.log('info',`success response 200 at salesReport`); 
        return responseHandler(res,200,null,{totalsale});
    }catch(error){
        console.log(error);
        //res.status(500).send({message:"something went wrong"})
        logger.log('info',`error response 500 at salesReport`); 
        return responseHandler(res,500,error,null);
    }
}



const searchInvoice =async(req,res)=>{
    //search invoice by id
    const {id} = req.params;
    try {
        let invoiceList;
        if(req.user.role === ROLE.CASHIER){
            invoiceList = await InvoiceModel.find({invoiceBy:req.user._id,_id:id})
        }else{
            invoiceList = await InvoiceModel.find({_id:id});
        }
        if(invoiceList.length===0){
            throw new Error("not found")
        } 
        //res.status(200).send(invoiceList);
        logger.log('info',`success response 200 at searchInvoice`); ;
        return responseHandler(res,200,null,invoiceList);
    } catch (error) {
        //res.status(500).send({message:"somthing went wrong"});
        logger.log('info',`error response 404 at searchInvoice`); 
        return responseHandler(res,404,error,null);
    }

}

module.exports = {
    generateInvoice,
    allInvoice,
    searchInvoice,
    salesReport,
    updateInvoice
}