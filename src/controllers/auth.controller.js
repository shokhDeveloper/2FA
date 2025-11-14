const { globalError, ClientError } = require("shokhijakhon-error-handler");
const hash = require("../lib/hash");
const otpGenerator = require("../utils/otpGenerator");
const UserModel = require("../models/User.model");
const emailService = require("../lib/mail.service");
const jwt = require("../lib/jwt");
const logger = require("../lib/winston");

module.exports = {
    async REGISTER(req, res){
        try{
            logger.debug(`REGISTER attempt with data: ${JSON.stringify(req.body)}`);
            let newUser = req.body;
            const findUser = await UserModel.findOne({email: newUser.email});
            if(findUser){
                logger.warn(`REGISTER failed: email already exists: ${newUser.email}`);
                throw new ClientError('User already exists', 400);
            }
            const password = await hash.hashPassword(newUser.password);
            newUser = {...newUser, password};
            const {otp, otpTime} = otpGenerator();
            await UserModel.create({
                ...newUser,
                otp,
                otpTime
            });
            logger.info(`New user registered: ${newUser.email}`);
            emailService(otp, newUser.email);
             logger.info(`Code sent to email ${newUser.email}`)
            return res.status(201).json({message: "User successfully registered !", status: 201});
        }catch(err){
            logger.error(`REGISTER error: ${err.message}`);
            return globalError(err, res);
        }
    },
    async VERIFY(req, res){
        try{
            logger.debug(`VERIFY request: ${JSON.stringify(req.body)}`);
            let data = req.body;
            const findUser = await UserModel.findOne({email: data.email});
            if(!findUser) {
                logger.warn(`VERIFY failed: user not found (${data.email})`);
                throw new ClientError('User not found', 404);
            } 
            if(findUser.otp !== data.otp) {
                logger.warn(`VERIFY failed: invalid OTP for ${data.email}`);
                throw new ClientError('OTP invalid', 400);
            }
            const currentDate = Date.now();
            if(currentDate > findUser.otpTime) {
                await UserModel.findOneAndUpdate({email: data.email}, {otp: null})
                logger.warn(`VERIFY failed: invalid expired for ${data.email}`);
                throw new ClientError('OTP expired', 400);
            };
            await UserModel.findOneAndUpdate({email: data.email}, {isVerified: true});
            logger.info(`Email has been successfully verified: ${data.email}`)
            return res.json({message: "OTP successfully verified !", status: 200})
        }catch(err){
            logger.error(`VERIFY profile error: ${err.message}`)
            return globalError(err, res);
        }
    },
    async RESEND_OTP(req, res){
        try{
            logger.debug(`RESEND_OTP attempt: ${JSON.stringify(req.body)}`);
            let data = req.body;
            let findUser = await UserModel.findOne({email: data.email});
            if(!findUser) {
                logger.warn(`RESEND_OTP failed: user not found (${data.email})`)
                throw new ClientError('User not found', 404);
            }
            let {otp, otpTime} = otpGenerator();
            await emailService(otp, data.email);
            logger.info(`Code sent to email ${data.email}`)
            await UserModel.findOneAndUpdate({email: data.email}, {otp, otpTime});
            return res.json({message: "OTP successfully resent !", status: 200});
        }catch(err){
            logger.error(`RESEND_OTP error: ${err.message}`);
            return globalError(err, res);
        }
    },
    async FORGOT_PASSWORD(req, res){
        try{
            logger.debug(`FORGOT_PASSWORD request: ${JSON.stringify(req.body)}`);
            const data = req.body;
            const findUser = await UserModel.findOne({email: data.email});
            if(!findUser) {
                logger.warn(`FORGOT_PASSWORD failed: user not found (${data.email})`)
                throw new ClientError('User not found', 404);
            }
            await UserModel.findOneAndUpdate({email: data.email}, {isVerified: false});
            const {otp, otpTime} = otpGenerator();
            await emailService(otp, findUser.email);
            logger.info(`Code sent to email ${data.email}`);
            await UserModel.findOneAndUpdate({email: data.email}, {otpTime, otp});
            return res.json({message: "Code has ben send please check your email"});
        }catch(err){
            logger.error(`FORGOT_PASSWORD error: ${err.message}`);
            return globalError(err, res);
        }
    },
    async CHANGE_PASSWORD(req, res){
        try{
            logger.debug(`CHANGE_PASSWORD attempt for: ${req.body.email}`);
            let data = req.body;
            const findUser = await UserModel.findOne({email: data.email});
            if(!findUser){
                logger.warn(`CHANGE_PASSWORD failed: user not found (${data.email})`);
                throw new ClientError('User not found', 404);
            };
            if(!findUser.isVerified){
                logger.warn(`CHANGE_PASSWORD failed: account not verified (${data.email})`);
                throw new ClientError('Please verify your account', 400);
            }
            data.new_password = await hash.hashPassword(data.new_password);
            await UserModel.findOneAndUpdate({email: data.email}, {password: data.new_password});
             logger.info(`Password changed successfully for ${data.email}`);
            return res.json({message: "Password successfully changed", status: 200});
        }catch(err){
            logger.error(`CHANGE_PASSWORD error: ${err.message}`);
            return globalError(err, res);
        }
    },
    async LOGIN(req, res){
        try{
            logger.debug(`LOGIN attempt: ${req.body.email}`);
            let data = req.body;
            const findUser = await UserModel.findOne({email: data.email});
            if(!findUser) {
                logger.warn(`LOGIN failed: user not found -> ${data.email}`);
                throw new ClientError('User not found', 404);
            }
            const checkPassword = await hash.comparePassword(data.password, findUser.password);
            if(!checkPassword) {
                logger.warn(`LOGIN failed: wrong password -> ${data.email}`);
                throw new ClientError("User not found", 404);
            }
            const accessToken = jwt.createToken({user_id: findUser._id, userAgent: req.headers["user-agent"], role: findUser.role});
            const refreshToken = jwt.createRefreshToken({user_id: findUser._id, role: findUser.role, userAgent: req.headers["user-agent"] });
            
            findUser.refreshTokens.push(
                {token: refreshToken, role: findUser.role, userAgent: req.headers["user-agent"] }
            );

            await findUser.save();

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            logger.info(`LOGIN success: ${data.email}`);

            return res.json({message: "User successfully logged in", status: 200, accessToken})
        }catch(err){
            return globalError(err, res);
        }
    },
    async REFRESH(req, res){
        try{
            const refreshToken = req.cookies.refreshToken;
            logger.debug(`REFRESH attempt. Token: ${refreshToken}`);
            if(!refreshToken) {
                logger.warn(`REFRESH failed: no refresh token provided`);
                throw new ClientError('Refresh token not found', 401);
            }
            let parseToken = jwt.parseRefreshToken(refreshToken);
            if (req.headers["user-agent"] !== parseToken.userAgent) {
                logger.warn(`REFRESH failed: user-agent mismatch for user_id=${parseToken.user_id}`);
                throw new ClientError('Invalid token', 401);
            }
            const findUser = await UserModel.findById(parseToken.user_id);
            if (!findUser) {
                logger.warn(`REFRESH failed: user not found with id=${parseToken.user_id}`);
                throw new ClientError('Invalid access token', 401);
            }
            let payload = { user_id: findUser._id, userAgent: req.headers["user-agent"], role: findUser.role };
            let accessToken = jwt.createToken(payload);
            logger.info(`REFRESH success: new access token generated for user=${findUser.email || findUser._id}`);
            return res.json({ message: "Acces token successfully generated !", accessToken, status: 200 });
        }catch(err){
            return globalError(err, res);
        }
    }
}

// forgotPassword (emailni tasdiqlaydi)
// ChangePassword
// login
// logout

/*
    {
        email: "",
        new_password: ""
    }

*/