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

/*
@route  PUT api/posts/like/:id
@desc   Like a post
@access Private
*/
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

/*
@route  PUT api/posts/unlike/:id
@desc   Unlike a post
@access Private
*/
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has no yet been liked' });
    }
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/posts/comment/:id
// @desc    Add comment to post
// @access  Private
router.put(
  '/comment/:id',
  [auth, [check('text', 'Test is required').not().isEmpty()]],
  (req, res) => {
    const errors = validationResult(req);

    // Check Validation
    if (!errors.isEmpty()) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then((post) => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id,
        };

        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then((post) => res.json(post));
      })
      .catch((err) => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

// @route   PUT api/posts/comment/:id/:comment_id
// @desc    Remove comment from post
// @access  Private
router.put('/comment/:id/:comment_id', auth, (req, res) => {
  Post.findById(req.params.id)
    .then((post) => {
      // Check to see if comment exists
      if (
        post.comments.filter(
          (comment) => comment._id.toString() === req.params.comment_id
        ).length === 0
      ) {
        return res
          .status(404)
          .json({ commentnotexists: 'Comment does not exist' });
      }

      // Get remove index
      const removeIndex = post.comments
        .map((item) => item._id.toString())
        .indexOf(req.params.comment_id);

      // Splice comment out of array
      post.comments.splice(removeIndex, 1);

      post.save().then((post) => res.json(post));
    })
    .catch((err) => res.status(404).json({ postnotfound: 'No post found' }));
});

module.exports = router;
