"use strict";
const User = require("../models").User;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let data = [{ username: "admin", password: "h3llo" }];
    return await User.bulkCreate(data);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("users", null, {});
  },
};
