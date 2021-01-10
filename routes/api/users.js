const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/*
@route  POST api/users
@desc   Register User
@access Public
*/
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include valid email').isEmail(),
    check(
      'password',
      'Please ener a password with minimum of 6 characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    //get the errors from middleware
    const errors = validationResult(req);
    const { name, email, password } = req.body;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Check if user exists
    try {
      let user = await User.findOne({ email: email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }
      //get users gravatar?
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });
      //encrypt password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        avatar,
      });
      await newUser.save();
      //make the payload
      const payload = {
        user: {
          id: newUser.id,
        },
      };

      //sign the token and send
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 3000 },
        (err, token) => {
          if (err) {
            throw error;
          } else {
            res.json({ token });
          }
        }
      );
    } catch (error) {
      console.error(error.message);
    }
  }
);

module.exports = router;
