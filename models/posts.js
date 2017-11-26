const Post = require('../lib/mongo').Post;
const marked = require('marked');
const CommentModel = require('./comments');

// 给post 添加留言数 commentsCount
Post.plugin('addCommentsCount', {
  afterFind: function(posts) {
    return Promise.all(posts.map(function(post) {
      return CommentModel.getCommentCount(post._id).then(function(commentsCount) {
        post.commentsCount = commentsCount;
        return post;
      })
    }))
  },
  afterFindOne: function (post) {
    if(post) {
      return CommentModel.getCommentCount(post._id).then(function(count) {
        post.commentsCount = count;
        return post;
      })
    }
    return post;
  }
})

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
  },
  // 通过文章id获取一篇原生文章（编辑文章）
  getRawPostById: function getRawPostById(postId) {
    return Post
      .findOne({_id: postId})
      .populate({path: 'author', model: 'User'})
      .exec()
  },
  // 通过文章id更新一篇文章
  updatePostById: function updatePostById (postid, data) {
    return Post.update({_id: postId}, {$set: data})
  },
  // 通过文章id删除一篇文章
  delPostById: function delPostById(postId, author) {
    return Post.remove({author: author, _id: postId}).exec()
      .then(function(res) {
        // 文章删除后，再删除改文章下的所有的留言
         if (res.result.ok && res.result.n >0) {
           return CommentModel.delComentById(postId);
         }
      })
  }
};
