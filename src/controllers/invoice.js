const InvoiceModel =  require('../db/Models Schema/invoice');
const ObjectID = require('mongodb').ObjectID;
const {ROLE} = require('../userRoles/roles');
const responseHandler = require('../util/responseHandler')
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
        //res.status(200).send(newInvoiceSaved); 
        return responseHandler(res,200,null,newInvoiceSaved);  
    } catch (error) {
        console.log(error)
        //res.status(500).send(error.message);
        return responseHandler(res,200,error,null);
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
        return responseHandler(res,200,null,invoiceList);
    } catch (error) {
        console.log(error)
        //res.status(500).send({message:"somthing went wrong!"});
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
        return responseHandler(res,200,null,{totalsale});
    }catch(error){
        console.log(error);
        //res.status(500).send({message:"something went wrong"})
        return responseHandler(res,500,error,null);
    }
}



const searchInvoice =async(req,res)=>{
    //search invoice by id
    const {id} = req.params;
    try {
        let invoiceList;
        console.log(ROLE.CASHIER)
        if(req.user.role === ROLE.CASHIER){
            invoiceList = await InvoiceModel.find({invoiceBy:req.user._id,_id:id})
        }else{
            invoiceList = await InvoiceModel.find({_id:id});
        }
        if(invoiceList.length===0){
            res.status(404).send("not found");
            return ;
        } 
        //res.status(200).send(invoiceList);
        return responseHandler(res,200,null,invoiceList);
    } catch (error) {
        //res.status(500).send({message:"somthing went wrong"});
        return responseHandler(res,500,error,null);
    }

}

//update invoice 
//invoice can only be updated by superadmin admin or cashier who made it
const updateInvoice = async(req,res)=>{
    const{id} = req.params;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['customerName','customerEmail','productsDetail'];
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))
    if(!isValidOperation) return res.status(404).send({error:'Invalid updates'})

    try{
        const invoice = await InvoiceModel.find({_id:id});
        if(!invoice){
            return res.status(404).send({message:"invoice not found"});
        }
        var  totalAmmount=0,totalTax=0;
        if(updates['productsDetail']){
            updates['productsDetail'].forEach((product)=>{
                totalAmmount+=product.price;
                product.tax = product.price * 0.10; //10%
                totalTax+=product.tax;
            })
            invoice['totalAmmount'] = totalAmmount;
            invoice['totalTax'] = totalTax;
        }
        updates.forEach((update)=>invoice[update]=req.body[update]);
        //console.log(invoice);
        await invoice.save();
        //res.status(200).send(invoice);
        return responseHandler(res,200,null,invoice);
    }catch(error){
        //console.log(error)
        //res.status(500).send({message:"something went wrong"});
        return responseHandler(res,200,error,null);
    }

}
module.exports = {
    generateInvoice,
    allInvoice,
    searchInvoice,
    salesReport,
    updateInvoice
}