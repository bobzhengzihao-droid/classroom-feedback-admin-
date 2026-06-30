// js/auth.js
var Auth = {
  ADMIN_COLLECTION: 'admins',

  initCloudBase: function () {
    return window.cloudbase.init({
      env: 'cloudbase-d3gqm8sr8db1d7582'
    });
  },

  login: function () {
    var self = this;
    var auth = App.cloudbase.auth({ persistence: 'local' });

    // 先检查是否已登录（扫码回调后刷新页面）
    return auth.getLoginState().then(function (state) {
      if (state && state.user) {
        return self.checkAdmin(state.user.uid).then(function (isAdmin) {
          if (isAdmin) return { isAdmin: true };
          auth.signOut();
          throw new Error('您不是管理员');
        });
      }
      // 未登录 → 跳转到云开发内置登录页（微信扫码）
      return auth.toDefaultLoginPage();
    });
  },

  checkAdmin: function (openid) {
    var db = App.cloudbase.database();
    return db.collection(this.ADMIN_COLLECTION)
      .where({ openid: openid })
      .get()
      .then(function (res) {
        return res.data && res.data.length > 0;
      })
      .catch(function () { return false; });
  },

  logout: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    auth.signOut().then(function () { window.location.reload(); });
  }
};
