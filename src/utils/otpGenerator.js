module.exports =  () => ({
    otp: Number(Array.from({length: 6}, () => Math.ceil(Math.random() * 9)).join("")),
    otpTime: Date.now() + 120000
});

