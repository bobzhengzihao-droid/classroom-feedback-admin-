// js/auth.js
// 认证模块 — 匿名登录 + 管理密码验证
var Auth = {
  ADMIN_COLLECTION: 'admins',

  initCloudBase: function () {
    var cloudbase = window.cloudbase;
    return cloudbase.init({
      env: 'cloudbase-d3gqm8sr8db1d7582'
    });
  },

  // 匿名登录（无需微信扫码）
  loginAnonymously: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    return auth.getLoginState().then(function (state) {
      if (state && state.user) {
        return state;
      }
      return auth.anonymousAuthProvider().signIn();
    });
  },

  // 校验管理密码
  checkPassword: function (password) {
    var db = App.cloudbase.database();
    return db.collection(this.ADMIN_COLLECTION)
      .where({ password: password })
      .get()
      .then(function (res) {
        return res.data && res.data.length > 0;
      })
      .catch(function () {
        return false;
      });
  },

  login: function (password) {
    var self = this;
    return self.loginAnonymously().then(function () {
      return self.checkPassword(password).then(function (valid) {
        if (!valid) {
          throw new Error('wrong_password');
        }
        return { isAdmin: true };
      });
    });
  },

  logout: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    return auth.signOut();
  }
};
