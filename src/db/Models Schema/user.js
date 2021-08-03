//schema for superadmin, admin and cashier
//schema for invoide
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){//using validator library to validate our email
                throw new Error('Email is invalid');
            }
        }
    },
    password:{
        type:String,
        required:true,
        minlength:7,
        trim:true,//trim all the spaces
        // validate(value){
        //     if(value.toLowerCase().includes('password')){
        //         throw new Error('Password contain "password"')
        //     }
        // }
    },
    passwordFlag:{
        type:Boolean,
        default:false
    },
    role:{
        type:String,
        required:true
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' //to create relationship with User model
    },
    tokens:[{
        token:{
            type:String,
            required:true,
        }
    }],
})
userSchema.statics.findByCredentials = async(email, password)=>{
    const user = await UserModel.findOne({email});
    if(!user) throw new Error("Email not found");
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) throw new Error('Unable to login');

    return user;
}
userSchema.methods.generateAuthToken = async function(){
    const user = this;
    console.log("here",user._id)
  
    const token = jwt.sign({_id:user._id},process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
}
userSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();
    delete userObject.passwordFlag;
    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}
userSchema.pre('save',async function(next){
    const user = this;
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8);
    }
    next();
})


const UserModel = mongoose.model('UserModel', userSchema);

module.exports = UserModel;