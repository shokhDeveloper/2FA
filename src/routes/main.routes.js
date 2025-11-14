const {Router} = require("express");
const authRouter = require("./auth.routes");
const userRouter = require("./user.routes");
const checkTokenGuard = require("../middlewares/check.token.guard");

const mainRouter = Router();

mainRouter.use("/auth", authRouter);

mainRouter.use(checkTokenGuard);

mainRouter.use("/users", userRouter);

module.exports = mainRouter;