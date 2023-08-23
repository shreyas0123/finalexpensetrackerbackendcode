const express = require('express');
const routes = express.Router();
const add = require('../controller/forgotpassword');

routes.post('/forgot-password',add.forgotpassword);

routes.get("/resetpassword/:id",add.resetpassword)

routes.get("/updatepassword/:resetpassword",add.updatepassword)

module.exports = routes;
