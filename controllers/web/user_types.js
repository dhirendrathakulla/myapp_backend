const UserType = require("../../db/models").UserType;

module.exports = {
  /**
   * paginate UserTypes index
   */
  async paginate(req, res, next) {
    let result = {};
    let limit = 20;
    let offset = 0;
    try {
      UserType.findAndCountAll().then((data) => {
        let page = req.params.page;
        let pages = Math.ceil(data.count / limit);
        offset = limit * (page - 1);
        UserType.findAll({
          limit: limit,
          offset: offset,
          $sort: { id: 1 },
        }).then((UserTypes) => {
          result.response = "success";
          result.data = UserTypes;
          result.currentPage = req.params.page;
          result.totalRows = UserTypes.length;
          result.count = data.count;
          result.pages = pages;
          res.status(200).send(result);
        });
      });
    } catch (err) {
      console.log("error", err);
      next(err);
    }
  },
  /**
   * Index
   */
  async index(req, res, next) {
    let result = {};
    let errors = [];

    const id = req.params.id;

    if (id) {
      const user_type = await UserType.findOne({
        where: { id },
      });
      result.response = "success";
      result.data = user_type;
      res.status(200).send(result);
    } else {
      const user_type = await UserType.findAll({});
      result.response = "success";
      result.data = user_type;
      res.status(200).send(result);
    }
  },
  /**
   *  Add UserType
   */

  async add(req, res, next) {
    let result = {};
    let errors = [];

    if (!req.is("application/json")) {
      errors.push({ msg: "multipart/form-data" });
      return res.status(200).send(errors);
    }

    const { name } = req.body;
    if (!name) {
      errors.push({ msg: "name is a required field." });
    }

    if (errors.length > 0) {
      result.response = "error";
      result.error = errors;
      return res.status(200).send(result);
    }

    try {
      // Add UserType
      await UserType.create({ name })
        .then((inserted) => {
          if (inserted) {
            result.response = "success";
            result.data = inserted;
            res.status(200).send(result);
          }
        })
        .catch((error) => {
          result.response = "error";
          errors.push({ msg: error });
          result.errors = errors;
          return res.status(200).send(result);
        });
    } catch (err) {
      next(err);
    }
  },
  /**
   *  Edit UserType
   */

  async edit(req, res, next) {
    let result = {};
    let errors = [];

    if (!req.is("application/json")) {
      errors.push({ msg: "application/json" });
      return res.status(200).send(errors);
    }

    const { id, name, status } = req.body;

    if (!id) {
      errors.push({ msg: "user_type id is a required field." });
    }

    if (errors.length > 0) {
      result.response = "error";
      result.errors = errors;
      return res.status(200).send(result);
    }

    try {
      const checkUserTypeExists = await UserType.findOne({
        where: { id },
      });
      if (checkUserTypeExists) {
        // Add UserType
        const updateUserType = await UserType.update(
          { name, status },
          {
            where: { id },
          }
        );

        if (updateUserType) {
          const updatedUserTypeDetails = await UserType.findOne({
            where: { id },
          });
          result.response = "success";
          result.data = updatedUserTypeDetails;
          res.status(200).send(result);
        } else {
          result.response = "error";
          errors.push({ msg: error });
          result.errors = errors;
          return res.status(200).send(result);
        }
      } else {
        result.response = "error";
        errors.push({ msg: "No user_type found with the given user_type id" });
        result.errors = errors;
        return res.status(200).send(result);
      }
    } catch (err) {
      next(err);
    }
  },
  /**
   *  Delete UserType
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
      const checkUserTypeExists = await UserType.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: "UserTypeUsers",
          },
        ],
      });
      if (checkUserTypeExists) {
        if (checkUserTypeExists.UserTypeUsers.length > 0) {
          result.response = "error";
          errors.push({
            msg: "Cannot delete user type, foreignkey constraint.",
          });
          result.errors = errors;
          return res.status(200).send(result);
        }
        try {
          const deleteUserType = await UserType.destroy({
            where: { id },
          });

          if (deleteUserType) {
            result.response = "success";
            result.msg = "UserType Sucessfully deleted";
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
        errors.push({ msg: "No user_type found with the given user_type_id" });
        result.errors = errors;
        return res.status(200).send(result);
      }
    } else {
      result.response = "error";
      errors.push({ msg: "UserType id not provided." });
      result.errors = errors;
      return res.status(200).send(result);
    }
  },
  /**
   *  toggleUser
   */

  async toggleUserType(req, res, next) {
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
      const checkUserTypeExists = await UserType.findOne({
        where: { id },
      });
      if (checkUserTypeExists) {
        try {
          const toggleUserType = await UserType.update(
            { status },
            { where: { id } }
          );

          if (toggleUserType) {
            result.response = "success";
            if (status === 1) result.msg = "UserType activated successfully.";
            else result.msg = "UserType deactivated successfully.";
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
        errors.push({ msg: "No user type found with the given id" });
        result.errors = errors;
        return res.status(200).send(result);
      }
    } else {
      result.response = "error";
      errors.push({ msg: "User type id not provided." });
      result.errors = errors;
      return res.status(200).send(result);
    }
  },
};
