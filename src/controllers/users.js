const UserModel =  require('../db/Models Schema/user');
const {ROLE} = require('../userRoles/roles')
const logger = require('../util/logger');
const responseHandler = require('../util/responseHandler');
const ObjectID = require('mongodb').ObjectID;
const {sendWelcomeEmail} = require('../util/email');
const dotenv = require('dotenv');
dotenv.config();

const initialilizing = async (req,res)=>{
    try {
        const user = await UserModel.find();
        if(user.length===0){
            //const defaultUser = await makeDefaultUser();
            const defaultUser = await UserModel.create({name:process.env.DEFAULT_SUPERADMIN_NAME,
                email:process.env.DEFAULT_SUPERADMIN_EMAIL,
                password:process.env.DEFAULT_SUPERADMIN_PASSWORD,
                role:ROLE.SUPERADMIN,
                createdBy: new ObjectID()
                                                            
            })
            const token = await defaultUser.generateAuthToken();
            //res.status(200).json({defaultUser,token});
            logger.log('info',`200 response at initializing `); 
            sendWelcomeEmail(defaultUser.email, defaultUser.name,defaultUser.password);//welcome mail with password
            return responseHandler(res,200,null,{defaultUser,token});
        }
        //res.status(200).json({message:"login required for any process"})//change unauth
        logger.log('info',`success 200 response at initializing `); 
        return responseHandler(res,200,null,{message:"login required for any process"});
    } catch (error) {
        //res.status(500).json({message:"something went wrong"})
        logger.log('info',`error 500 response at initializing `); 
        return responseHandler(res,500,error,null);
    }
}
const signin = async(req,res)=>{
    const {email,password} = req.body;
    try{
        const user = await UserModel.findByCredentials(email,password);
        const token = await user.generateAuthToken();
        if(user.passwordFlag===false){
            //res.send({user,token,message:"please change your default password"});
            logger.log('info',`200 response at signin `); 
            return responseHandler(res,200,null,{user,token,message:"please change your default password"});
        }else{
            //res.send({user,token});
            logger.log('info',`200 response at signin `); 
            return responseHandler(res,200,null,{user,token});
        }
        
    }catch(error){
        //console.log(error);
        //res.status(400).send();
        logger.log('info',`error 400 response at signin `); 
        return responseHandler(res,400,error,null);
    }
}
const createUser =async (req,res)=>{
    const {role} = req.params;
    const {name,email} = req.body;
    console.log(process.env.DEFAULT_ADMIN_PASSWORD)
    try {
        if(role !== "super-admin" && role!=="admin" && role!=="cashier"){ //fix logic
            throw new Error("role doesn't exists!");
        }
        const newUser = new UserModel({name,email,password:process.env.DEFAULT_PASSWORD,role,createdBy:req.user._id})//default pass
        const newUserSaved = await newUser.save();
        const token = await newUserSaved.generateAuthToken();

        logger.log('info',`200 response at createUser `); 
        sendWelcomeEmail(newUserSaved.email, newUserSaved.name,process.env.DEFAULT_PASSWORD);
        return responseHandler(res,200,null,{newUserSaved,token});
        
    } catch (error) {
        //res.status(500).send(error.message)
        logger.log('info',`500 response at createUser `); 
        return responseHandler(res,500,error,null);
    }

}
const getUsers = async(req,res)=>{
    //super admin can see all users, admin can see admins and cashier, cashier can see his own data
    //const req.user.role = req.user.req.user.role;
    try {
        let users;
                                  //!!revise this logic make it dynamic and with design pattern
        if(req.user.role === ROLE.SUPERADMIN){
            users = await UserModel.find();
        }else if(req.user.role === ROLE.ADMIN){
            users = await UserModel.find({role:ROLE.ADMIN});
        }else{
            users =await UserModel.findById(req.user._id);
        }
        //res.status(200).json(users);
        logger.log('info',`200 response at getUsers `); 
        return responseHandler(res,200,null,users);
    } catch (error) {
        //console.log(error);
        //res.status(500).send({message:"something went wronge"});
        logger.log('info',`500 response at getUsers `); 
        return responseHandler(res,500,error,null);
    }
}
const updateUser = async(req,res)=>{
    //make a chek if password is updated make passwordFlag true
    const updates = Object.keys(req.body);
    
    const allowedUpdates = ['name','email','password'];
    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update);
    })
    if(!isValidOperation){
        logger.log('info',`error 404 response at updateUser `); 
        throw new Error("Invalid updates");
    } 
    try {
        const user = await UserModel.findById({_id:req.params.id});
        
        if(!user){
            logger.log('info',`error 404 response at updateUser `); 
            throw new Error("access denied");
        }
        updates.forEach((update)=>user[update] = req.body[update]);
        if(updates.includes('password')){
            user['passwordFlag'] =  true;
        }
        await user.save();
        //res.send(user);
        logger.log('info',`success 200 response at updateUser `);
        return responseHandler(res,200,null,user);
    } catch (error) {
        //console.log(error);
        //res.status(400).send(error);
        logger.log('info',`400 response at updateUser `);
        return responseHandler(res,400,error,null);
    }
}

module.exports = {
    initialilizing,
    signin,
    createUser,
    getUsers,
    updateUser
}