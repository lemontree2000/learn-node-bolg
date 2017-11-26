const path = require('path');
const assert = require('assert');
const request = require('supertest');
const app = require('../index');
const User = require('../lib/mongo').User;

const testName = 'testName1';
const testName2 = 'edward';

describe('signup', function() {
  describe('POST /signup', function() {
    const agent = request.agent(app)
    beforeEach(function(done) {
      User.create({
        name: testName,
        password: '123456',
        avatar: '',
        gender: 'x',
        bio: ''
      })
        .exec()
        .then(function() {
          done();
        })
        .catch(done);
    })
    afterEach(function (done) {
      User.remove({
        name: {$in: [testName, testName2]}
      })
      .exec()
      .then(function() {
        done();
      })
      .catch(done);
    })
    // 用户名错误的情况
    it('wrong name', function(done) {
      agent
        .post('/signup')
        .type('form')
        .attach('avatar', path.join(__dirname, 'avatar.png'))
        .field({name: ''})
        .redirects()
        .end(function(err, res) {
          if(err) return done(err);
          assert(res.text.match(/名字请限制在 1-10 个字符/));
          done();
        })
    })
    // 性别错误的情况
    it('wrong gender', function (done) {
      agent
        .post('/signup')
        .type('form')
        .attach('avatar', path.join(__dirname, 'avatar.png'))
        .field({ name: testName2, gender: 'a' })
        .redirects()
        .end(function (err, res) {
          if (err) return done(err)
          assert(res.text.match(/性别只能是 m、f 或 x/))
          done()
        })
    })
     // 用户名被占用的情况
    it('duplicate name', function (done) {
      agent
        .post('/signup')
        .type('form')
        .attach('avatar', path.join(__dirname, 'avatar.png'))
        .field({ name: testName1, gender: 'm', bio: 'noder', password: '123456', repassword: '123456' })
        .redirects()
        .end(function (err, res) {
          if (err) return done(err)
          assert(res.text.match(/用户名已被占用/))
          done()
        })
    })
    // 注册成功的情况
    it('success', function (done) {
      agent
        .post('/signup')
        .type('form')
        .attach('avatar', path.join(__dirname, 'avatar.png'))
        .field({ name: testName2, gender: 'm', bio: 'noder', password: '123456', repassword: '123456' })
        .redirects()
        .end(function (err, res) {
          if (err) return done(err)
          assert(res.text.match(/注册成功/))
          done()
        })
    })
  })
})
