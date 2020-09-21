"use strict";

const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");

const config = require("../db/config/custom.js");
const User = require("../db/models").User;
const Subscription = require("../db/models").Subscription;
var models = require("../db/models");
const { QueryTypes } = require("sequelize");

const getUniqueKeyFromBody = function (body) {
  // this is so they can send in 3 options unique_key, username, or phone and it will work
  let unique_key = body.username;
  if (typeof unique_key === "undefined") {
    if (typeof body.username !== "undefined") {
      unique_key = body.username;
    } else {
      unique_key = null;
    }
  }

  return unique_key;
};
module.exports.getUniqueKeyFromBody = getUniqueKeyFromBody;

const authUser = async function (userInfo, callback) {
  //returns token
  let unique_key;
  let auth_info = {};
  auth_info.status = "login";

  unique_key = getUniqueKeyFromBody(userInfo);
  if (!unique_key)
    return callback(new Error("Please enter an username to login"));

  if (!userInfo.password)
    return callback(new Error("Please enter a password to login"));

  // let user;

  const user = await User.findOne({
    where: {
      username: unique_key,
      status: 1,
      user_type_id: 2, // only for member
    },
  });
  if (user === null) {
    return callback("Are u a member ? Not registered.");
  } else {
    const result = user.correctPassword(userInfo.password);
    if (result === true) {
      await user.update({ verifyToken: null });
      const { token, expiration } = issueToken(user.id);
      callback(null, { response: "success", token, expiration, user });
    } else {
      return callback(null, { response: "errors" });
    }
  }
};
module.exports.authUser = authUser;

function issueToken(userId) {
  const expiration = parseInt(config.login.jwtExpiration);
  const token =
    // "Bearer: " +
    jwt.sign({ user_id: userId }, config.login.jwtEncryption, {
      expiresIn: expiration,
    });
  return { token, expiration };
}
