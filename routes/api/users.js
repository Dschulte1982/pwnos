const express = require('express');
const router = express.Router();
const { asyncHandler, handleValidationErrors } = require('../utils');
const { getUserToken } = require('../utils/auth');

const csrfProtection = require("csurf")({ cookie: true });

const bcrypt = require('bcryptjs');
const { expiresIn } = require('../../config').jwtConfig;
const db = require('../../db/models');
const { Op } = require('sequelize');
const { User, Like, Article } = db;

const { check } = require('express-validator');


const validateUsername = [
  check("username")
    .exists()
];

const validateAuthFields = [
  check("username", "Username field must be between 5 and 30 characters")
    .isLength({ min: 5, max: 30 }),
  check("email", "Email fields must be a valid email")
    .exists()
    .isEmail(),
  check("password", "Password field must be 6 or more characters")
    .exists()
    .isLength({ min: 6, max: 70 }),
  check('password2', 'Confirm password field must have the same value as the password field')
     .exists()
     .custom((value, { req }) => value === req.body.password)
]

//signup route
router.post('/',
csrfProtection,
validateUsername,
validateAuthFields,
handleValidationErrors,
asyncHandler(async (req, res) => {

  const { username, email, password } = req.body;

  const user = await User.create({
    username,
    hashedPassword: bcrypt.hashSync(password, 10),
    email
  });


  const token = await getUserToken(user);
  res.cookie('token', token, { maxAge: expiresIn * 1000 });

  res.json({ id: user.id, token });

}));

//Logging In
router.post('/token',
csrfProtection,
validateUsername,
handleValidationErrors, asyncHandler( async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email: username }],
    },
  });

  if (!user || !user.validatePassword(password)) {
    const err = new Error('Invalid username/password');
    err.status = 401;
    err.title = "Unauthorized";
    throw err;
  }
  const token = await getUserToken(user);

  res.cookie('token', token, { maxAge: expiresIn * 1000 });

  res.json({ id: user.id, token });
}));

//Logging into Demo User account
router.post('/demo',
validateUsername,
handleValidationErrors, asyncHandler( async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({
    where: {
      [Op.or]: [{ username }, { email: username }],
    },
  });

  if (!user || !user.validatePassword(password)) {
    const err = new Error('Invalid username/password');
    err.status = 401;
    err.title = "Unauthorized";
    throw err;
  }
  const token = await getUserToken(user);

  res.cookie('token', token, {maxAge: expiresIn * 1000 });

  res.json({ id: user.id, token });

}));

//Profile Page - Functionality not currently supported by model associations.
router.get('/:id(\\d+)', csrfProtection, asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const claps = await Like.findAll({
    where: {
      userId
    },
    include: [
      {
        model: User,
        attributes: ['username'],
      },
      {
        model: Article,
        attributes: ['title']
      }
    ],
  });
  const user = await User.findByPk(userId);
res.json({ claps, user });
}));

router.delete('/:id(\\d+)', asyncHandler( async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    next(err);
    return;
  }

  await user.destroy();
  res.json({ message: `User "${user.username} successfully deleted` });
}));

module.exports = router;
