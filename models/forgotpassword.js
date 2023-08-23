const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const forgotpassword = sequelize.define("forgotpassword",{
    id:{
        type:Sequelize.UUID, 
        //id - this is a uuid (unique identifier just like id but it is normally a long string 
        //so that other people cannot guess ) Use this library to generate UUIDS 
        allowNull:false,
        primaryKey:true //uniquely represent each row in an table
    },
    isactive:Sequelize.BOOLEAN
    
})

async function forgotpasswordTable(){
    try{
        const data = await forgotpassword.sync();
        console.log('table called forgotpassword created successfully');
    }catch(error){
        console.log('error wile creating forgotpassword table',error);
    }
}
forgotpasswordTable();

module.exports = forgotpassword;