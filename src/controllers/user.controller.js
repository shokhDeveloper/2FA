const { globalError } = require("shokhijakhon-error-handler");
const UserModel = require("../models/User.model");

module.exports = {
    async GET_ALL_USERS(req, res){
        try{
            const users = await UserModel.find();
            return res.json(users);
        }catch(err){
            return globalError(err, res);
        }
    }
}