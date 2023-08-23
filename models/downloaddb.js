const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const download=sequelize.define("download",{
    id:{
        type:Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
    },
    url:{
        allowNull:false,
        type:Sequelize.STRING
    }
})
module.exports = download