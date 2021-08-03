const UserModel =  require('../db/Models Schema/user');
const {ROLE} = require('../userRoles/roles')
const responseHandler = require('../util/responseHandler');
const ObjectID = require('mongodb').ObjectID;
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
            return responseHandler(res,200,null,{defaultUser,token});
        }
        //res.status(200).json({message:"login required for any process"})//change unauth
        return responseHandler(res,200,null,{message:"login required for any process"});
    } catch (error) {
        //res.status(500).json({message:"something went wrong"})
        return responseHandler(res,200,error,null);
    }
}
const signin = async(req,res)=>{
    const {email,password} = req.body;
    try{
        const user = await UserModel.findByCredentials(email,password);
        const token = await user.generateAuthToken();
        if(user.passwordFlag===false){
            //res.send({user,token,message:"please change your default password"});
            return responseHandler(res,200,null,{user,token,message:"please change your default password"});
        }else{
            //res.send({user,token});
            return responseHandler(res,200,null,{user,token});
        }
        
    }catch(error){
        //console.log(error);
        //res.status(400).send();
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
        const newUser = new UserModel({name,email,password:process.env.DEFAULT_ADMIN_PASSWORD,role,createdBy:req.user._id})//default pass
        const newUserSaved = await newUser.save();
        const token = await newUserSaved.generateAuthToken();
        
        if(newUserSaved.passwordFlag===false){
            //res.send({newUserSaved,token,message:"please change your default password"});
            return responseHandler(res,200,null,{newUserSaved,token,message:"please change your default password"});
        }else{
            //res.status(200).json({newUserSaved,token});
            return responseHandler(res,200,null,{newUserSaved,token});
        }
        
    } catch (error) {
        //res.status(500).send(error.message)
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
        return responseHandler(res,200,null,users);
    } catch (error) {
        //console.log(error);
        //res.status(500).send({message:"something went wronge"});
        return responseHandler(res,500,error,null);
    }
}
const updateUser = async(req,res)=>{
    const updates = Object.keys(req.body);
    
    const allowedUpdates = ['name','email','password'];
    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update);
    })
    console.log(isValidOperation);
    if(!isValidOperation) return res.status(404).send({error:"Invalid updates"})
    try {
        const user = await UserModel.findById({_id:req.params.id});
        if(!user){
            return res.status(404).send({message:"denied"});
        }
        updates.forEach((update)=>user[updates] = req.body[update]);
        await user.save();
        //res.send(user);
        return responseHandler(res,200,null,user);
    } catch (error) {
        //console.log(error);
        //res.status(400).send(error);
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