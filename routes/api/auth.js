const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

/*
@route  GET api/auth
@desc   Get user info
@access Private
*/
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v');
    return res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/*
@route  POST api/auth/login
@desc   Login user and return token
@access Public
*/
router.post(
  '/login',
  [
    check('email', 'Please include valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    //get the errors from middleware
    const errors = validationResult(req);
    const { email, password } = req.body;
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Check if user exists
    try {
      let user = await User.findOne({ email: email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      //match paaawords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      //make the payload
      const payload = {
        user: {
          id: user.id,
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
