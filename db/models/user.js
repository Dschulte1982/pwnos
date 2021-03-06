'use strict';

const bcrypt = require('bcryptjs');

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    validatePassword(password) {
      return bcrypt.compareSync(password, this.hashedPassword.toString());
    }
    static associate(models) {
      User.hasMany(models.Article, { foreignKey: 'authorId' });
      User.hasMany(models.Like, { foreignKey: 'userId' });
      User.belongsToMany(models.User, {
        through: 'Follow',
        as: "follows",
        foreignKey: "authorId",
      });
      User.belongsToMany(models.User, {
        through: 'Follow',
        as: "followers",
        foreignKey: "userId",
      });
      User.belongsToMany(models.Article, {
        through: 'Like',
        as: 'userLikes',
        foreignKey: 'articleId'
      });
      User.belongsToMany(models.Article, {
        through: 'Bookmark',
        as: 'bookmarks',
        foreignKey: 'articleId',
      });
      User.belongsToMany(models.Category, {
        through: 'Interest',
        as: 'interests',
        foreignKey: 'categoryId',
      });
    }
  };
  User.init({
    username: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [5, 30],
          msg: 'Username must be between 5 and 30 characters long.'
        },
      },
    },
    email: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      }
    },
    hashedPassword: {
      allowNull: false,
      type: DataTypes.STRING.BINARY,
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
