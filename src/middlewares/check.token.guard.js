const { globalError, ClientError } = require("shokhijakhon-error-handler");
const jwt = require("../lib/jwt");
const UserModel = require("../models/User.model");

module.exports = async (req, res, next) => {
    try{
        const accessToken = req.headers.token;
        if(!accessToken) throw new ClientError('Access token not found', 401);
        const parseAccessToken = jwt.parseToken(accessToken);
        if(req.headers["user-agent"] !== parseAccessToken.userAgent) throw new ClientError('Invalid access token', 401);
        const findUser = await UserModel.findById(parseAccessToken.user_id);
        if(!findUser) throw new ClientError('Invalid access token', 401);
        return next();
    }catch(err){
        if(err.name == "TokenExpiredError"){
            return res.status(401).json({
                code: "TOKEN_EXPIRED",
                message: "Access token expired"
            })
        };
        return globalError(err, res);
    }
}