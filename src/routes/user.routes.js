const {Router} = require("express");
const userController = require("../controllers/user.controller");

const userRouter = Router();

userRouter.get("/", userController.GET_ALL_USERS);

module.exports = userRouter;