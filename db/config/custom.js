require("dotenv").config();

module.exports = {
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: {
      user: process.env.SMTP_AUTH_USER,
      pass: process.env.SMTP_AUTH_PASS,
    },
  },
  login: {
    jwtExpiration: process.env.JWT_EXPIRATION,
    jwtEncryption: process.env.JWT_ENCRYPTION,
  },
};
