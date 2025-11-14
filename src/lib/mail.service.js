const nodemailer = require("nodemailer");

const emailService = async (otp, email) => {
    const transport = nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: process.env.MY_EMAIL,
            pass: process.env.MY_EMAIL_PASS
        }
    })
    await transport.sendMail({
        from: process.env.MY_EMAIL,
        to: email,
        subject: "Library email verify",
        text: `OTP:${otp}, ushbu password faqat 2 daqiqa amal qiladi`
    })
};

module.exports = emailService;