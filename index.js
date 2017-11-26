const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const config = require('config-lite')(__dirname);

const routes = require('./routes');
const pkg = require('./package');
const winstion = require('winston');
const expressWinstion = require('express-winston');


const app = express();

app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  name: config.session.key, // 设置 cookie 中保存 session id 的字段名称
  secret: config.session.secret, // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  resave: true, // 强制更新 session
  saveUninitialized: false, // 设置为 false，强制创建一个 session，即使用户未登录
  cookie: {
    maxAge: config.session.maxAge// 过期时间，过期后 cookie 中的 session id 自动删除
  },
  store: new MongoStore({// 将 session 存储到 mongodb
    url: config.mongodb// mongodb 地址
  })
}))
// flash 中间件，用来显示通知
app.use(flash())

app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/upload'),
  keepExtensions: true // 保留后缀
}))

// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
}

// 添加版面必须的三个变量
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success').toString();
  res.locals.error = req.flash('error').toString();
  next();
})

// 正常请求的日志
app.use(expressWinstion.logger({
  transports: [
    new (winstion.transports.Console)({
      json: true,
      colorize: true
    }),
    new winstion.transports.File({
      filename: 'logs/success.log'
    })
  ]
}))

// 路由
routes(app)

app.use(expressWinstion.errorLogger({
  transports: [
    new winstion.transports.Console({
      json: true,
      colorize: true
    }),
    new winstion.transports.File({
      filename: 'logs/error.log'
    })
  ]
}))

app.use(function (err, req, res, next) {
  console.error(err)
  req.flash('error', err.message)
  res.redirect('/posts')
})

// 直接启动 index.js 则会监听端口启动程序，如果 index.js 被 require 了，则导出 app，通常用于测试。
if (module.parent) {
  module.exports = app;
} else {
  // 监听端口，启动程序
  app.listen(config.port, function () {
    console.log(`${pkg.name} listening on port ${config.port}`)
  })
}



