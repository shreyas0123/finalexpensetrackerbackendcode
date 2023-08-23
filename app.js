const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const sequelize = require('./util/database');
//expenseDetails: This is a middleware function that you have defined in another file (probably ./routes/addexpense)
// Middleware functions are often used to handle specific aspects of the request-response cycle, such as route handling, authentication, error handling, etc.
const expenseDetails = require('./routes/addexpense');
const signupORDetails = require('./routes/signupORlogin');
const purchasePremium = require('./routes/purchase-mebership');
const premium_leaderBoard = require('./routes/premium');
const password = require('./routes/forgotpassword');
const helmet = require('helmet'); //it will provide essential http headers
const compression = require('compression'); //it used to reduce the size of an front end files such as expense.js,css etc
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

require("dotenv").config(); // Load environment variables from .env file

const User = require('./models/signup');
const Expense = require('./models/define');
const Order = require('./models/order');
const Forgotpassword = require('./models/forgotpassword');
const Download = require('./models/downloaddb');

// creating an instance of an Express application
const app = express();

app.use(cors());
app.use(bodyparser.json());
// you are adding a middleware function named expenseDetails to your Express application's middleware stack
//app.use() will be executed for every incoming request.
app.use(expenseDetails);
app.use(signupORDetails);
app.use(purchasePremium);
app.use(premium_leaderBoard);
app.use(password);

const accessLogStream = fs.createWriteStream(path.join(__dirname,"request.log"),{flags:"a"})

app.use(helmet());
app.use(compression());
//morgan package is used to log http request and we are creating file called "request.log" in order to store the http request
app.use(morgan('combined', {stream:accessLogStream}));
//app.use(express.static('public'));

//Relationship between User and Expense table:
//create an association rules:
//it is one to many relationship because
//one user can add multiple expenses but expenses belongs to one particular user only
//In Sequelize, defining the association rules between models also sets up the foreign key relationships automatically. 
User.hasMany(Expense);
Expense.belongsTo(User);

//Relationship between User and Order table:
//it is one to many relationship because
//one user can make multiple orders but multiple oders can belongs to one user only
//eg: i will make an order of pizza, so i will get my orderId(99) whenever pizza gets ready servant will call me
//this orderId will not going to get others its an unique orderId
User.hasMany(Order);
Order.belongsTo(User);

//ForgotPasswordRequests would have Many to One relationship with User table as Single User can generate multiple forgot password requests
//single user can have multiple password but one password belongs to one particular user only
User.hasMany(Forgotpassword);
Forgotpassword.belongsTo(User);

User.hasMany(Download);
Download.belongsTo(User);

sequelize.sync() //{force:true}
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log('server running successfully');
    })
})
.catch((error)=>{
    console.log('error while connecting to database',error);
})

