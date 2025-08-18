const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Token = sequelize.define("Token", {
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
});

module.exports = Token;
