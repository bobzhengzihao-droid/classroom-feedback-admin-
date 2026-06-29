// js/auth.js
// CloudBase 认证模块 — 初始化、登录/登出、管理员白名单校验
var Auth = {
  ADMIN_COLLECTION: 'admins',

  initCloudBase: function () {
    var tcb = window.cloudbase;
    var app = tcb.init({
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

    // 先检查是否已经登录
    return auth.getLoginState().then(function (state) {
      if (state && state.user) {
        return self.checkAdmin(state.user.uid).then(function (isAdmin) {
          if (isAdmin) {
            return { openid: state.user.uid, isAdmin: true };
          } else {
            auth.signOut();
            throw new Error('not_admin');
          }
        });
      }

      // 未登录：跳转到云开发 Web 登录页
      var callbackUrl = window.location.href;
      var loginUrl = 'https://cloudbase-d3gqm8sr8db1d7582.service.tcloudbase.com/login?callback_url=' + encodeURIComponent(callbackUrl);
      window.location.href = loginUrl;

      // 返回 pending promise（页面即将跳转）
      return new Promise(function () {});
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
