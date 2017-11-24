const Post = require('../lib/mongo').Post;
const marked = require('marked');

Post.plugin('contentToHtml', {
  afterFind: function (posts) {
    return posts.map(function(post) {
      post.content = marked(post.content);
      return post;
    })
  },
  afterFindOne: function(post) {
    if(post) {
      post.content = marked(post.content);
    }
    return post;
  }
})

module.exports = {
  // 创建一篇文章
  create: function create(post) {
    return Post.create(post).exec();
  },
  getPostById: function getPostById(postId) {
    return Post
      .findOne({_id: postId})
      .populate({path: 'author', model: 'User'})
      .addCreatedAt()
      .contentToHtml()
      .exec();
  },
  getPosts: function getPosts (author) {
    const query = {};
    if (author) {
      query.author = author;
    }
    return Post
      .find(query)
      .populate({path: 'author', model: 'User'})
      .sort({_id: -1})
      .addCreatedAt()
      .contentToHtml()
      .exec();
  },
  // 通过文章id给pv加1
  incPv: function incPv (postId) {
    return Post
      .update({_id: postId}, {$inc: {pv: 1}})
      .exec()
  }
};
