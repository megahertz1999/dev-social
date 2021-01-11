const { compare } = require('bcryptjs');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

/*
@route  GET api/profile/me
@desc   Get current user profile
@access Private
*/
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

/*
@route  POSt api/profile
@desc   Create or update a user profile
@access Private
*/
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      bio,
      location,
      status,
      skills,
      youtube,
      facebook,
      githubusername,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //Build profile object
    let profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      //check if profile exists
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //if profile exists then update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  }
);

/*
@route  GET api/profile
@desc   Get all profiles
@access Public
*/
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    return res.json(profiles);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/*
@route  GET api/profile/user/:id
@desc   Get profile by user id
@access Public
*/
router.get('/user/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/*
@route  DELETE api/profile/
@desc   Delete profile of user
@access Private
*/
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });

    return res.json({ msg: 'User was deleted' });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/*
@route  PUT api/profile/experience
@desc   Add experience of a user in profile
@access Private
*/
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      description,
      current,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  }
);

/*
@route  DELETE api/profile/experience/:id
@desc   Delete experience of a user in profile
@access Private
*/
router.delete('/experience/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    const index = profile.experience
      .map((exp) => exp._id)
      .indexOf(req.params.id);
    profile.experience.splice(index, 1);
    await profile.save();
    return res.json(profile);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
