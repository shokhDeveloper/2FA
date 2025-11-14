const jwt = require("jsonwebtoken");
module.exports = {
    createToken: (payload) => jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {expiresIn: "60s"}),
    parseToken: (token) => jwt.verify(token, process.env.ACCESS_TOKEN_KEY),
    createRefreshToken: (payload) => jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, {expiresIn: "30d"}),
    parseRefreshToken: (token) => jwt.verify(token, process.env.REFRESH_TOKEN_KEY),
};

// AccessToken (Frontendga yuboriladi) (1minut, 30 sekund)
// RefreshToken (1 year)