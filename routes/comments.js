const express = require('express');
const router = express.Router();

const checkLogin = require('../middlewares/check').checkLogin;
const CommentModle = require('../models/comments');

// POST /comments 创建一条留言
router.post('/', checkLogin, function(req, res, next) {
  // res.send('创建留言');
  const author = req.session.user._id;
  const postId = req.fields.postId;
  const content = req.fields.content;

  // 校验参数
  try {
    if (!content.length) {
      throw new Error('请填写留言内容');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  const comment = {
    author: author,
    postId: postId,
    content: content
  };

  CommentModle.create(comment)
    .then(function() {
      req.flash('success', '留言成功');
      // 再一次success写掉了一个c，你是多喜欢掉这个？？？？
      res.redirect('back');
      // 留言成功后跳转到上一页
    })
    .catch(next);
});
// GET /comments/:commentId/remove 删除一条留言
router.get('/:commentId/remove', checkLogin, function(req, res, next) {
  // res.send('删除留言');
  const commentId = req.params.commentId;
  const author = req.session.user._id;

  CommentModle.getCommentById(commentId).then(function(comment) {
    if (!comment) {
      throw new Error('留言不存在');
    }
    if (comment.author.toString() !== author.toString()) {
      throw new Error('没有权限删除留言');
    }
    CommentModle.delCommentById(commentId)
      .then(function() {
        req.flash('success', '删除留言成功');
        // 删除成功后跳转到上一页
        res.redirect('back');
      })
      .catch(next);
  });
});

module.exports = router;
