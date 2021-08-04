function responseHandler(res,statuscode,error,result){
    console.log(statuscode)
        if(error){
            res.status(statuscode).send(error.message);
        }else{
            res.status(statuscode).send(result);
        }
    
}
module.exports = responseHandler;
