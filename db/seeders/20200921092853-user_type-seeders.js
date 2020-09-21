"use strict";
const UserType = require("../models").UserType;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let data = [{ name: "admin" }, { name: "member" }];
    return await UserType.bulkCreate(data);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("user_types", null, {});
  },
};
