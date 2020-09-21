"use strict";

module.exports = (sequelize, DataTypes) => {
  const UserType = sequelize.define(
    "UserType",
    {
      name: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "user_types",
      hooks: {
        beforeFind: function (result) {
          if (!result.attributes)
            result.attributes = {
              exclude: ["createdAt", "updatedAt"],
            };
        },
      },
    }
  );

  UserType.associate = function (models) {
    UserType.hasMany(models.User, {
      foreignKey: "user_type_id",
      as: "UserTypeUsers",
    });
  };

  return UserType;
};
