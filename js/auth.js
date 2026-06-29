// js/auth.js
// CloudBase 认证模块 — 初始化、登录/登出、管理员白名单校验
var Auth = {
  ADMIN_COLLECTION: 'admins',

  initCloudBase: function () {
    var cloudbase = window.cloudbase;
    var app = cloudbase.init({
      env: 'cloudbase-d3gqm8sr8db1d7582'
    });
    return app;
  },

  checkAdmin: function (openid) {
    var db = App.cloudbase.database();
    return db.collection(this.ADMIN_COLLECTION)
      .where({ openid: openid })
      .get()
      .then(function (res) {
        return res.data && res.data.length > 0;
      })
      .catch(function () {
        return false;
      });
  },

  login: function () {
    var self = this;
    var auth = App.cloudbase.auth({ persistence: 'local' });

    // 先检查是否已登录（例如从登录页回调回来）
    return auth.getLoginState().then(function (state) {
      if (state && state.user) {
        var openid = state.user.uid;
        return self.checkAdmin(openid).then(function (isAdmin) {
          if (isAdmin) {
            return { openid: openid, isAdmin: true };
          } else {
            auth.signOut();
            throw new Error('not_admin');
          }
        });
      }

      // 未登录：使用 SDK 内置登录页跳转
      return auth.toDefaultLoginPage().then(function (loginState) {
        if (!loginState || !loginState.user) {
          throw new Error('login_failed');
        }
        var openid = loginState.user.uid;
        return self.checkAdmin(openid).then(function (isAdmin) {
          if (isAdmin) {
            return { openid: openid, isAdmin: true };
          } else {
            auth.signOut();
            throw new Error('not_admin');
          }
        });
      });
    }).catch(function (err) {
      console.error('[Auth] login error:', err);
      throw err;
    });
  },

  getLoginState: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    return auth.getLoginState();
  },

  logout: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    return auth.signOut();
  }
};
