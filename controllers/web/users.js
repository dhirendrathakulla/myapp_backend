const User = require("./../../db/models").User;
const UserType = require("./../../db/models").UserType;
const authService = require("./../../services/auth.services");
const validator = require("validator");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const models = require("./../../db/models");
module.exports = {
  /**
   * Register User
   */
  async signup(req, res, next) {
    let result = {};
    let insertBody = {};
    let errors = [];
    let subscribtions = {};

    if (!req.is("application/json")) {
      errors.push({
        msg: "Expects 'application/json'",
      });
      return res.status(200).send(errors);
    }

    /** Validation for username and password */
    const { username, password, user_type_id, email, program_id } = req.body;
    subscribtions.program_id = program_id;
    if (validator.isEmpty(username)) {
      errors.push({
        msg: "Please enter a valid username.",
      });
    }

    if (validator.isEmpty(password)) {
      errors.push({
        msg: "Please enter a password.",
      });
    }

    if (email === undefined) {
      errors.push({
        msg: "Please enter your email.",
      });
    }

    if (
      user_type_id === "" ||
      user_type_id === null ||
      user_type_id === undefined
    ) {
      errors.push({ msg: "user type id is missing" });
    }
    console.log(errors.length);
    if (errors.length > 0) {
      result.response = "error";
      result.errors = errors;
      return res.status(200).send(result);
    }

    insertBody.username = username;
    insertBody.password = password;
    insertBody.user_type_id = user_type_id;
    insertBody.email = email;
    if (
      req.body.status &&
      (req.body.status !== "" || req.body.status !== null)
    ) {
      insertBody.status = req.body.status;
    }
    if (
      req.body.address_line_1 &&
      (req.body.address_line_1 !== "" || req.body.address_line_1 !== null)
    ) {
      insertBody.address_line_1 = req.body.address_line_1;
    }

    if (
      req.body.address_line_2 &&
      (req.body.address_line_2 !== "" || req.body.address_line_2 !== null)
    ) {
      insertBody.address_line_2 = req.body.address_line_2;
    }
    if (req.body.city && (req.body.city !== "" || req.body.city !== null)) {
      insertBody.city = req.body.city;
    }
    if (req.body.state && (req.body.state !== "" || req.body.state !== null)) {
      insertBody.state = req.body.state;
    }
    if (
      req.body.country &&
      (req.body.country !== "" || req.body.country !== null)
    ) {
      insertBody.country = req.body.country;
    }
    if (
      req.body.contact_no &&
      (req.body.contact_no !== "" || req.body.contact_no !== null)
    ) {
      insertBody.contact_no = req.body.contact_no;
    }
    await User.create(insertBody)
      .then((newUser) => {
        result.response = "success";
        result.userId = newUser.id;
        res.status(201).send(result);
        //save subscirbe program
        if (subscribtions.program_id) {
          subscribtions.user_id = newUser.id;
          Subscription.create(subscribtions);
        }
      })
      .catch((error) => {
        let sequelizeError = {};
        if (error.name === "SequelizeUniqueConstraintError") {
          sequelizeError = error.errors[0].message;
        }
        result.response = "error";
        errors.push({
          msg: sequelizeError,
        });
        result.errors = errors;
        return res.status(200).send(result);
      });
  },
  /**
   * Login User
   */
  async login(req, res, next) {
    let result = {};
    let errors = [];

    if (!req.is("application/json")) {
      errors.push({ msg: "Expects 'application/json'" });
      return res.status(200).send(errors);
    }

    /** username and Password Validation */
    if (validator.isEmpty(req.body.username)) {
      errors.push({ msg: "Please enter a valid username." });
    }

    if (validator.isEmpty(req.body.password)) {
      errors.push({ msg: "Please enter a password." });
    }

    if (errors.length > 0) {
      result.response = "error";
      result.errors = errors;
      return res.status(200).send(result);
    }

    try {
      await authService.authUser(req.body, (err, data) => {
        if (err) {
          errors.push({ msg: err });
          result.response = "errors";
          result.errors = errors;
          return res.status(200).send(result);
        }
        // no user
        if (data.response === "errors") {
          errors.push({ msg: "Please check username/password" });
          result.response = "errors";
          result.errors = errors;
          return res.status(200).send(result);
        }
        res.status(200).send(data);
      });
    } catch (err) {
      next(err);
    }
  },
  /**
   * Get Users
   */
  async index(req, res, next) {
    let result = {};
    try {
      User.findAll({
        include: [
          {
            model: UserType,
            as: "UserUserType",
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
          },
        ],
      }).then((users) => {
        result.response = "success";
        result.data = users;
        res.status(200).send(result);
      });
    } catch (err) {
      console.log("error", err);
      next(err);
    }
  },
  /**
   * paginate users index
   */
  async paginate(req, res, next) {
    let result = {};
    let limit = parseInt(req.body.limit);
    let offset = parseInt(req.body.offset);

    let filter_user_type_id = req.body.filter_user_type_id
      ? req.body.filter_user_type_id
      : 0;
    let filter_program_id = req.body.filter_program_id
      ? req.body.filter_program_id
      : 0;
    let filter_username = req.body.filter_username
      ? req.body.filter_username
      : "";
    try {
      //

      let result_search = [];
      let result_count = [];
      result_count = await models.sequelize.query(
        "CALL user_paginate_count (:in_user_type_id, :in_program_id, :in_username)",
        {
          replacements: {
            in_user_type_id: filter_user_type_id,
            in_program_id: filter_program_id,
            in_username: filter_username,
          },
        }
      );

      let pages = Math.ceil(result_count[0].count / limit);
      result_search = await models.sequelize.query(
        "CALL user_paginate (:in_user_type_id, :in_program_id, :in_username, :in_offset, :in_limit)",
        {
          replacements: {
            in_user_type_id: filter_user_type_id,
            in_program_id: filter_program_id,
            in_username: filter_username,
            in_offset: offset,
            in_limit: limit,
          },
        }
      );
      result.response = "success";
      result.data = result_search;
      result.currentPage = offset;
      result.totalRows = result_search[0].length;
      result.count = result_count[0].count;
      result.pages = pages;
      res.status(200).send(result);
    } catch (err) {
      console.log("error", err);
      next(err);
    }
  },
  /**
   * Change Password
   */
  async changePassword(req, res, next) {
    let result = {};
    let errors = [];

    if (!req.is("application/json")) {
      errors.push({ msg: "Expects 'application/json'" });
      return res.status(200).send(errors);
    }

    /** Validation for name, email and password */
    const { oldPassword, newPassword, confirmPassword, id } = req.body;

    if (id < 0) {
      errors.push({ msg: "Please login again." });
    }

    if (validator.isEmpty(oldPassword)) {
      errors.push({ msg: "Please enter your old Password." });
    }

    if (validator.isEmpty(newPassword)) {
      errors.push({ msg: "Please enter your new Password." });
    }

    if (validator.isEmpty(confirmPassword)) {
      errors.push({ msg: "Please enter your confirm Password." });
    }

    if (newPassword !== confirmPassword) {
      errors.push({ msg: "Password are not matched." });
    }

    if (errors.length > 0) {
      result.response = "error";
      result.errors = errors;
      return res.status(200).send(result);
    }

    try {
      const user = await User.findOne({
        where: { id },
      });
      if (user) {
        if (user.correctPassword(oldPassword)) {
          await user
            .update({
              password: newPassword,
            })
            .then((data) => {
              result.response = "success";
              res.status(200).send(result);
            })
            .catch((err) => console.log("Error ", err));
        } else {
          result.response = "error";
          errors.push({ msg: "Old password is not correct." });
          result.errors = errors;
          return res.status(200).send(result);
        }
      } else {
        result.response = "error";
        errors.push({ msg: "Could not fetch user details." });
        result.errors = errors;
        return res.status(200).send(result);
      }
    } catch (err) {
      next(err);
    }
  },
  /**
   * Edit User
   */
  async edit(req, res, next) {
    let result = {};
    let updateBody = {};
    let errors = [];
    let subscription = {};

    if (!req.is("application/json")) {
      errors.push({ msg: "Expects 'application/json'" });
      return res.status(200).send(errors);
    }

    const { email, id, program_id, subscription_id } = req.body;
    if (email) {
      updateBody.email = email;
    }
    if (id === null || id === "") {
      errors.push({ msg: "ID should be passed." });
    }
    if (errors.length > 0) {
      result.response = "error";
      result.error = errors;
      return res.status(200).send(result);
    }

    if (
      req.body.user_type_id &&
      (req.body.user_type_id !== "" || req.body.user_type_id !== null)
    ) {
      updateBody.user_type_id = req.body.user_type_id;
    }
    if (
      req.body.status &&
      (req.body.status !== "" || req.body.status !== null)
    ) {
      updateBody.status = req.body.status;
    }
    if (
      req.body.address_line_1 &&
      (req.body.address_line_1 !== "" || req.body.address_line_1 !== null)
    ) {
      updateBody.address_line_1 = req.body.address_line_1;
    }
    if (
      req.body.address_line_2 &&
      (req.body.address_line_2 !== "" || req.body.address_line_2 !== null)
    ) {
      updateBody.address_line_2 = req.body.address_line_2;
    }
    if (req.body.city && (req.body.city !== "" || req.body.city !== null)) {
      updateBody.city = req.body.city;
    }
    if (req.body.state && (req.body.state !== "" || req.body.state !== null)) {
      updateBody.state = req.body.state;
    }
    if (
      req.body.country &&
      (req.body.country !== "" || req.body.country !== null)
    ) {
      updateBody.country = req.body.country;
    }
    if (
      req.body.contact_no &&
      (req.body.contact_no !== "" || req.body.contact_no !== null)
    ) {
      updateBody.contact_no = req.body.contact_no;
    }
    if (req.body.password) {
      updateBody.password = req.body.password;
    }

    try {
      const user = await User.findOne({
        where: { id },
      });
      if (user) {
        const updateUser = await user.update(updateBody, { where: { id } });
        if (updateUser.id) {
          const updatedUser = await User.findOne({
            where: { id },
          });
          result.response = "success";
          result.data = updatedUser;
          // Subscription
          if (program_id && subscription_id) {
            const checkSubscriptionExists = await Subscription.findOne({
              where: { id: subscription_id },
            });
            if (checkSubscriptionExists) {
              const updateSubscription = await Subscription.update(
                { program_id },
                {
                  where: { id: subscription_id },
                }
              );
            }
          } else if (program_id && !subscription_id) {
            // Add New Subscription
            const oldSubscription = await Subscription.findAll({
              where: { id },
            });
            if (oldSubscription) {
              const updateSubscription = await Subscription.update(
                { status: 0 },
                {
                  where: { user_id: id },
                }
              );
            }
            subscription.user_id = id;
            subscription.program_id = program_id;
            await Subscription.create(subscription);
          }

          return res.status(200).send(result);
        }
      } else {
        result.response = "error";
        errors.push({ msg: "User not found with given id." });
        result.error = errors;
        return res.status(200).send(result);
      }
    } catch (err) {
      next(err);
    }
  },
  /**
   *  Delete User
   */

  async delete(req, res, next) {
    // update status to 0 instead of deleting
    let result = {};
    let errors = [];

    if (!req.is("application/json")) {
      errors.push({ msg: "application/json" });
      return res.status(200).send(errors);
    }

    const { id } = req.body;

    if (id) {
      const checkUserExists = await User.findOne({
        where: { id },
      });
      if (checkUserExists) {
        try {
          const deleteUser = await User.update(
            { status: 0 },
            { where: { id } }
          );

          if (deleteUser) {
            result.response = "success";
            result.msg = "User inactivated successfully.";
            res.status(200).send(result);
          } else {
            result.response = "error";
            errors.push({ msg: error });
            result.errors = errors;
            return res.status(200).send(result);
          }
        } catch (err) {
          next(err);
        }
      } else {
        result.response = "error";
        errors.push({ msg: "No user found with the given user_id" });
        result.errors = errors;
        return res.status(200).send(result);
      }
    } else {
      result.response = "error";
      errors.push({ msg: "User id not provided." });
      result.errors = errors;
      return res.status(200).send(result);
    }
  },
  /**
   *  toggleUser
   */

  async toggleUser(req, res, next) {
    let result = {};
    let errors = [];

    if (!req.is("application/json")) {
      errors.push({ msg: "application/json" });
      return res.status(200).send(errors);
    }

    var { id, status } = req.body;

    if (status !== 1 && status !== 0) {
      errors.push({ msg: "missing status" });
      return res.status(200).send(errors);
    }

    status = status === 1 ? 0 : 1;
    if (id) {
      const checkUserExists = await User.findOne({
        where: { id },
      });
      if (checkUserExists) {
        try {
          const toggleUser = await User.update({ status }, { where: { id } });

          if (toggleUser) {
            result.response = "success";
            if (status === 1) result.msg = "User activated successfully.";
            else result.msg = "User deactivated successfully.";
            res.status(200).send(result);
          } else {
            result.response = "error";
            errors.push({ msg: error });
            result.errors = errors;
            return res.status(200).send(result);
          }
        } catch (err) {
          next(err);
        }
      } else {
        result.response = "error";
        errors.push({ msg: "No user found with the given user_id" });
        result.errors = errors;
        return res.status(200).send(result);
      }
    } else {
      result.response = "error";
      errors.push({ msg: "User id not provided." });
      result.errors = errors;
      return res.status(200).send(result);
    }
  },
  //Bulk status Update
  async bulkEditStatus(req, res, next) {
    let result = {};
    let errors = [];
    let count = 0;

    if (!req.is("application/json")) {
      errors.push({ msg: "application/json" });
      return res.status(200).send(errors);
    }

    var { selected, button } = req.body;
    for (const id of selected) {
      var status = button;

      if (id) {
        const checkbulkUserExists = await User.findOne({
          where: { id },
        });
        if (checkbulkUserExists) {
          try {
            const bulkEdit = await User.update({ status }, { where: { id } });

            if (bulkEdit) {
              result.response = "success";
              count++;
              if (count === selected.length) {
                if (status === 1) result.msg = "User activated successfully.";
                else result.msg = "User deactivated successfully.";
                res.status(200).send(result);
              }
            } else {
              result.response = "error";
              console.log(error);
              errors.push({ msg: error });
              result.errors = errors;
              return res.status(200).send(result);
            }
          } catch (err) {
            next(err);
          }
        } else {
          result.response = "error";
          errors.push({ msg: "No user found with the given id" });
          result.errors = errors;
          return res.status(200).send(result);
        }
      } else {
        result.response = "error";
        errors.push({ msg: "User id not provided." });
        result.errors = errors;
        return res.status(200).send(result);
      }
    }
  },
  async refreshToken(req, res, next) {
    let result = {};
    let errors = [];

    if (!req.is("application/json")) {
      errors.push({ msg: "Expects 'application/json'" });
      return res.status(200).send(errors);
    }
    const { id } = req.body;
    if (validator.isEmpty(req.body.id)) {
      errors.push({ msg: "Please enter a valid id." });
    }
    await User.findOne({
      where: {
        id: id,
      },
    }).then((user) => {
      if (user === null) {
        errors.push({ msg: "Not registered" });
      } else {
        const { token, expiration } = authService.issueToken(user.id);

        result.token = token;
        result.expiration = expiration;
      }
      if (errors.length > 0) {
        result.response = "error";
        result.error = errors;
        return res.status(200).send(result);
      } else {
        result.response = "success";
        return res.status(200).send(result);
      }
    });
  },
};
