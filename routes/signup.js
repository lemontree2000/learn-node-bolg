
const fs = require('fs')
const path = require('path')
const sha1 = require('sha1')

const express = require('express')
const router = express.Router()

const UserModel = require('../models/user');
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signup 注册页
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('signup')
})

// POST /signup 用户注册
router.post('/', checkNotLogin, function (req, res, next) {
  const name = req.fields.name;
  const gender = req.fields.gender;
  const bio = req.fields.bio;
  const avatar = req.files.avatar.path.split(path.sep).pop();
  let password = req.fields.password;
  const repassword = req.fields.repassword;

  // 校验参数

  try {
    if (!(name.length >= 1 && name.length <= 10)) {
      throw new Error('名字请限制在1-10个字符');
    }
    if (['m', 'f', 'x'].indexOf(gender) ===-1) {
      throw new Error('性别只能是 m、f或x');
    }
    if (!(bio.length >= 1 && bio.length <= 30)) {
      throw new Error('个人简介请限制在1-30个字符');
    }
    if (!req.files.avatar.name) {
      throw new Error('缺少头像');
    }
    if (password.length < 6) {
      throw new Error('密码至少6个字符');
    }
    if (password !== repassword) {
      throw new Error('两次密码输入不一致');
    }
  } catch (error) {
    // 注册失败，异步删除上传的头像
    console.log('验证失败', error);
    fs.unlink(req.files.avatar.path);
    req.flash('error', error.message)
    return res.redirect('/signup');
  }

  password = sha1(password);

  // 待写入数据库的用户信息
  let user = {
    name: name,
    password: password,
    gender: gender,
    bio: bio,
    avatar: avatar
  }

  UserModel.create(user)
    .then((result) => {
      // 此user时插入mongodb后的值，包含_id
      user = result.ops[0];
      // 删除密码这种敏感信息，将用户信息存入 session
      delete user.password;
      req.session.user = user;
      // 写入 flash
      req.flash('success', '注册成功');
      res.redirect('/posts');
    })
    .catch((error) => {
      // 注册失败，异步删除上传的头像
      fs.unlink(req.files.avatar.path)
      // 用户占用则返回注册页
      if (error.message.match('duplicate key')) {
        console.log('注册失败', error);

        req.flash('error', '用户名已被占用');
        return res.redirect('/signup');
      }
      next(error);
    })
})

module.exports = router
