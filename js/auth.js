// js/auth.js
// 认证模块 — 直接查 admins 集合校验密码（无登录态）
var Auth = {
  ADMIN_COLLECTION: 'admins',

  initCloudBase: function () {
    var cloudbase = window.cloudbase;
    return cloudbase.init({
      env: 'cloudbase-d3gqm8sr8db1d7582'
    });
  },

  login: function (password) {
    var db = App.cloudbase.database();
    return db.collection(this.ADMIN_COLLECTION)
      .where({ password: password })
      .get()
      .then(function (res) {
        if (res.data && res.data.length > 0) {
          return { isAdmin: true };
        }
        throw new Error('wrong_password');
      });
  },

  logout: function () {
    // 清除本地 session，刷新页面回到登录页
    window.location.reload();
  }
};
