const alldetails = require('../models/define');
const userdb = require('../models/signup');
const sequelize = require('../util/database');
const UserServices = require('../services/userservices');
const S3Service = require('../services/S3services');
const downloaddb = require('../models/downloaddb');

//adding new record into a database table using add method
//first step:
//how we can add means we need to first get the values of form fields like name,email,phone (req.body holds all these variables)
//we we make an http request(means when we click on submit button) forms fileds like expens,descript,categ values stored in an request.body

exports.addexpense = async (req, res, next) => {
    //A transaction is a way to group multiple database operations together in a single logical unit.
    const t = await sequelize.transaction();
    try {
        const expens = req.body.expens;
        const descript = req.body.descript;
        const categ = req.body.categ;
        console.log('from req.body>>>>>', expens, descript, categ);

        //second step:
        //Use the addexpense.create() method to create a new addexpense record in the database with the extracted values.
        //Await the completion of the create() method and assign the result to the data variable

        const data = await alldetails.create({
            expens: expens,
            descript: descript,
            categ: categ,
            userId: req.user.id
            //when we make an post request url along with in headers we are passing token
            //backend will recieves token and in the middleware we are dcrypting the token so we will get userId
            //from the userId you will comes to know that who is logged in
            //when we are adding the expenses what we have to do means in expense.create method just add the userId:req.user.id that's it 


            //It allows you to ensure that either all the operations succeed (commit), or if any of them fail, all of them are rolled back (rollback), 
            //keeping the database in a consistent state.
        }, { transaction: t })

        /***************************This is final leaderboard optimisation**************/
        //im creating new column called total expense in users table. whenever user adds a new expense 
        //im doing pre-calculating total expnese in total expense column only

        // Retrieve the user's current total expense from the database
        const currentUser = await userdb.findOne({ where: { id: req.user.id }, transaction: t });
        const currentTotalExpense = Number(currentUser.totalExpense);
        // Calculate the updated total expense by adding the new expense to the current total expense
        updatedTotalExpense = currentTotalExpense + Number(expens)

        //update the totalExpense column of users table
        await userdb.update({
            totalExpense: updatedTotalExpense
        }, {
            where: { id: req.user.id },
            transaction: t

        })
        //t.commit(): This method is used to commit (save) all the changes made during the transaction to the database. 
        //When this method is called, the transaction is completed, and the changes are permanently stored in the database.
        await t.commit();
        res.json({ expensedata: data });
        console.log('res from addexpense method', data);
    } catch (error) {
        //t.rollback(): This method is used to rollback (undo) all the changes made during the transaction. 
        //If an error occurs during the transaction or if there's a need to cancel the transaction for any reason, calling t.rollback() 
        //will undo all the changes made and leave the database in its original state before the transaction started.
        await t.rollback();
        res.json({ Error: error });
        console.log('error from addexpense method', error);
    }
}

//1st step
// the code calls user.findAll() to retrieve data. 
//It assumes that there is a user model or database table defined and connected.

//2nd step:
//The retrieved data is then transformed using the map method. 
//For each user object, a new object is created with additional properties, 
//including an _id property that corresponds to the id property of the original user object.
//The transformed data is stored in the modifiedData variable.

//3rd step:
//Finally, the res.json() method is used to send a JSON response back to the client. 
//It sends an object with a property named alluser, which contains the modifiedData array.

// This function handles the logic for fetching and paginating user expenses
exports.getexpense = async (req, res, next) => {
    try {
        // Count the total number of expenses for the user
        const totalexpense = await alldetails.count({ where: { userId: req.user.id } });

        // Extract the requested page and pageSize from the query parameters
        let page = +req.query.page || 1;
        const pageSize = +req.query.pagesize || 3;

        // Fetch expenses for the current page and pageSize
        alldetails
            .findAll({
                where: { userId: req.user.id },
                offset: (page - 1) * pageSize,
                limit: pageSize,
            })
            .then((expenses) => {
                // Calculate and send the pagination metadata along with the expenses
                res.status(201).json({
                    expenses: expenses,
                    currentPage: page,
                    hasNextPage: page * pageSize < totalexpense,
                    nextPage: page + 1,
                    hasPreviousPage: page > 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalexpense / pageSize),
                });
            })
            .catch((err) => {
                throw new Error(err);
            });
    } catch (err) {
        // Handle internal server error
        res.status(500).json(err);
    }
};

exports.deleteexpense = async (req, res) => {
    //A transaction is a way to group multiple database operations together in a single logical unit.
    const t = await sequelize.transaction();
    try {
        console.log('params id', req.params.id);
        if (!req.params.id) {
            throw new error('id is mandatory to delete');
        }

        const detailsId = req.params.id;
        const expenseToDelete = await alldetails.findOne({ where: { id: detailsId, userId: req.user.id } }, { transaction: t });

        // Capture the expens value of the expense to be deleted
        const expens = expenseToDelete.expens;

        const data = await alldetails.destroy({ where: { id: detailsId, userId: req.user.id } }, { transaction: t });
        //when we make an delete request url along with in headers we are passing token
        //backend will recieved token and in the middleware we are dcrypting the token so we will get userId
        //in expense.destroy where we also pass userId:req.user.id
        //i cannot delete others added expenses in the app,they also not able to delete my added expenses
        //if u want to check this means expense.finAll() keep it like this only so we can get all added expenses

        /***************************This is final leaderboard optimisation**************/
        //im creating new column called total expense in usertable. whenever user creates a new expense 
        //im doing pre-calculating total expnese in total expense column only
        //findone method we comes to which user wants to delete an expense by req.user.id,from id:detailsId we will get id of the item we want to delete


        // the code captures the expens value of the(expense-----line no:113) expense to be deleted before proceeding with the deletion.
        //Then, after the deletion is successful, it retrieves the current user's totalExpense, subtracts the expens value, and updates the totalExpense column accordingly.
        //This should now correctly deduct the deleted expense from the user's totalExpense in the userdb table.

        // Retrieve the user's current total expense from the database
        const currentUser = await userdb.findOne({ where: { id: req.user.id }, transaction: t });
        const currentTotalExpense = Number(currentUser.totalExpense);
        // Calculate the updated total expense by adding the new expense to the current total expense
        updatedTotalExpense = currentTotalExpense - Number(expens)


        await userdb.update({
            totalExpense: updatedTotalExpense
        }, {
            where: { id: req.user.id },
            transaction: t

        })
        await t.commit();
        res.json({ deleted: data });
    } catch (error) {
        await t.rollback();
        res.json({ Error: error });
        console.log('error from delete expense method', error);
    }
}

/*********************** downloadexpense ********************************/
/*********************** code for dowling the fileURL and fecthedData(in the fetched data we can able to see the history of downloading files respect to 1 user only) */

exports.downloadexpense = async (req, res) => {
    try {
        // Fetch expenses for the user from a service
        const expenses = await UserServices.getExpenses(req);

        // Convert expenses to a JSON string
        const stringifiedexpenses = JSON.stringify(expenses);

        // Get the user ID from the request
        const userId = req.user.id;

        // create a filename called Expense.txt in the s3 iam user based on user ID and current date
        const filename = `Expense${userId}/${new Date()}.txt`;

        // Upload the JSON data to an S3 bucket and get the file URL
        const fileURL = await S3Service.uploadToS3(stringifiedexpenses, filename);

        // Store the file URL in the download table
        const data = await downloaddb.create({
            url: fileURL,
            userId: req.user.id
        });

        // Fetch all data entries for the user from the download table
        const fetchedData = await downloaddb.findAll({ where: { userId: req.user.id } });

        // Send a JSON response with the uploaded file URL and fetched data
        res.status(200).json({ fileURL, alldata: fetchedData, success: true });
    } catch (err) {
        // Handle errors by logging and sending an error response
        console.log(err);
        res.status(500).json({ fileURL: '', success: false, err: err });
    }
};


//paginate expenses
exports.paginateExpenses=async(req,res)=>{
    try{
        const page=req.query.page
      const data=  await expensedatabase.findAll({
        offset:(page)*10,
        limit:10,
        where: { userId:req.user.id }
    })
      res.json({Data:data})
    }catch(err){
        console.log("pagination error-->",err)
        res.json({Error:err})
    }
}



/*
exports.editexpense = async (req,res) =>{
    try{
        console.log('params id',req.params.id);
        if(!req.params.id){
            throw new error('id is mandatory to delete');
        }
        const detailsId = req.params.id;
        const data  = await alldetails.destroy({where:{id:detailsId}});
        res.json({deleted:data});
    }catch(error){
        res.json({Error:error});
        console.log('error from delete expense method',error);
    }
}  */