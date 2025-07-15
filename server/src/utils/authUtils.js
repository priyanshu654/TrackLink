const jwt=require('jsonwebtoken');
const Users = require('../model/Users');
require('dotenv').config();
const refreshSecret=process.env.JWT_REFRESH_SECRET
const secret=process.env.JWT_SECRET;

const createRefreshToken=async(refreshToken)=>{
    try {
        console.log("Function me",refreshToken);
        
        const decoded=jwt.verify(refreshToken,refreshSecret);

        //fetch the latest user data
        const data=await Users.findById({_id:decoded.id});

        const user={
            id:data._id,
            username:data.email,
            name:data.name,
            role:data.role?data.role:"admin",
            credits:data.credits,
            subscription:data.subscription
        }

        const newAccessToken=jwt.sign(user,secret,{expiresIn:"1m"});
        console.log("Access token ban gya",newAccessToken);
        

        return {newAccessToken,user};


    } catch (error) {
        console.log(error);
        throw error
        
    }
}

module.exports={createRefreshToken}