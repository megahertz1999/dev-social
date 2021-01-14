const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

/*
@route  POST api/posts
@desc   Create a post
@access Private
*/
router.post(
  '/',
  [auth, [check('text', 'Test is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password -__v');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      return res.json(post);
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ msg: 'Server Error' });
    }
  }
);

/*
@route  GET api/posts
@desc   Get all posts
@access Private
*/
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    return res.json(posts);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/*
@route  GET api/posts/:id
@desc   Get post by id
@access Private
*/
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }
    return res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/*
@route  DELETe api/posts/:id
@desc   Get all posts
@access Private
*/
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }
    //check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await post.remove();
    return res.json({ msg: 'Post removed successfully' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Post not found' });
    }
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
