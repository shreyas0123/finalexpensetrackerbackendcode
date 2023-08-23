const getExpenses = (req,where)=>{
    //console.log('here***********');
    return req.user.getExpenses({where})
}

module.exports={
    getExpenses
}

//we created services folder in order to improve the design pattern
//in this folder we are doing network calls. It basically means --- DB calls (Relational database scheme),s3 calls(aws s3 using), api calls
//here we are separating the code so that we can use this code or functionality in other code also