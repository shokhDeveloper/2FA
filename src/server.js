const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const express = require("express");
const mainRouter = require("./routes/main.routes");
const cookieParser = require("cookie-parser");
const logger = require("./lib/winston");

const app = express();
app.use(express.json());
app.use(cookieParser())

app.use("/api", mainRouter);

async function bootstrap(){
    try{
        await mongoose.connect(process.env.dbUri);
        logger.info("MongoDB connected successfully");
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => logger.info(`Server is running on http://127.0.0.1:${PORT}`));
    }catch(err){
        console.log(`DB connection error`, err);
    }
};

bootstrap();