const jwt = require('jsonwebtoken');
const UserModel = require('../db/Models Schema/user');
const InvoiceModel = require('../db/Models Schema/invoice');
const logger = require('../util/logger');
const responseHandler = require('../util/responseHandler');
const {ROLE,ROLE_VALUE} = require('../userRoles/roles');
const dotenv = require('dotenv');
dotenv.config();
const auth = async(req,res,next)=>{
    try {
        
        const token = req.header('Authorization').replace('Bearer ','')
        const decoded = jwt.verify(token,process.env.JWT_SECRET);

        const user = await UserModel.findOne({_id:decoded._id,'tokens.token':token});
        if(!user){
            throw new Error("authentication failure");
        }
        req.token = token;
        req.user = user;
        if(user.passwordFlag===false){
            req.message = "please change your password"
        }
        logger.log('info',`success 200 response authentication`); 
        next();
    } catch (error) {
        //res.status(401).send({error:'authentication failure'});
        return responseHandler(res,400,error,null);
    }
}
const authRole = (req,res,next)=>{//some error
    const {role} = req.params;
    try {
        const LoggedUserRole = req.user.role;
        const LoggedUserRoleValue = ROLE_VALUE[LoggedUserRole];
        if(LoggedUserRoleValue===0 || LoggedUserRoleValue<ROLE_VALUE[role]){
           throw new Error();
        }
        logger.log('info',`success 200 response authRole`); 
        next();
    } catch (error) {
        //res.status(400).send({message:"user not allowed for this action"})
        return responseHandler(res,400,error,null);
    }

}

const authUpdateUser = (req,res,next)=>{
    const {id} = req.params;
    try{
        if(id!==req.user.id){
            throw new Error;
        }
        logger.log('info',`success 200 response authUpdateUser`); 
        next();
    }catch(error){
        //res.status(400).send({message:"user not allowed for this action"})
        logger.log('info',`error 400 response authUpdateUser`); 
        return responseHandler(res,400,error,null);
    }
}
const authGetInvoice = async(req,res,next)=>{
    
    try {
        if(req.user.role === ROLE.CASHIER){
            req.invoiceList = await InvoiceModel.find({invoiceBy:req.user._id,})
            next();
        }else{
            req.invoiceList = await InvoiceModel.find();
            next();
        }
    } catch (error) {
        //res.status(500).send({message:"somthing went wrong"});
        logger.log('info',`error 500 response authGetInvoice`); 
        return responseHandler(res,500,error,null);
    }
}


module.exports = {
    auth,
    authRole,
    authUpdateUser,
    authGetInvoice
}