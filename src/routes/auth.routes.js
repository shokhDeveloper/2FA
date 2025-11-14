const {Router} = require("express");
const authController = require("../controllers/auth.controller");

const authRouter = Router();

authRouter.post("/register", authController.REGISTER);
authRouter.post("/verify/otp", authController.VERIFY);
authRouter.post("/resend/otp", authController.RESEND_OTP);
authRouter.post("/forgot/password", authController.FORGOT_PASSWORD);
authRouter.put("/change/password", authController.CHANGE_PASSWORD);

authRouter.post("/login", authController.LOGIN);
authRouter.post("/refresh", authController.REFRESH);


module.exports = authRouter;

// token