const marked = require('marked');
const Comment = require('../lib/mongo').Comment;

// 将comment 的 content 从 markdown转化成html

Comment.plugin('contentToHtml', {
  afterFind: function (comments) {
    return comments.map(function(comment) {
      comment.content = marked(comment.content)
      return comment;
    })
  }
})

module.exports = {
  // 创建一个留言
  create: function create (comment) {
    return Comment.create(comment).exec()
  },

  // 通过留言id获取一个留言
  getCommentById: function getCommentById(commentId) {
    return Comment.findOne({_id: commentId}).exec()
  },

  // 通过留言id删除一个留言
  delComentById: function delComentById (commentId) {
    return Comment.remove({_id: commentId}).exec()
  },
  // 通过文章id获取改文章所有留言, 安留言创建时间升序
  getComments: function getComments(postId) {
    return Comment
    .find({postId: postId})
    .populate({path: 'author', model: 'User'})
    .sort({_id: 1})
    .addCreatedAt()
    .contentToHtml()
    .exec()
  },
  // 通过文章id获取改文章下的留言数
  getCommentCount: function getCommentCount (postId) {
    return Comment.count({postId: postId}).exec();
  }
}
