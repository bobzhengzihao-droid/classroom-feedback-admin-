// js/auth.js
var Auth = {
  ADMIN_COLLECTION: 'admins',

  initCloudBase: function () {
    var cloudbase = window.cloudbase;
    return cloudbase.init({
      env: 'cloudbase-d3gqm8sr8db1d7582'
    });
  },

  login: function (password) {
    var self = this;
    var auth = App.cloudbase.auth({ persistence: 'local' });

    // 先尝试匿名登录
    return auth.anonymousAuthProvider().signIn().then(function () {
      // 匿名登录成功，查库验证密码
      var db = App.cloudbase.database();
      return db.collection(self.ADMIN_COLLECTION)
        .where({ password: password })
        .get()
        .then(function (res) {
          if (res.data && res.data.length > 0) {
            return { isAdmin: true };
          }
          throw new Error('密码错误');
        });
    }).catch(function (e) {
      if (e.message === '密码错误') throw e;
      console.error('[Auth] 匿名登录失败:', e.message || e);
      throw new Error('匿名登录未开启，请先在云开发控制台 → 登录授权 → 开启匿名登录');
    });
  },

  logout: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    return auth.signOut().then(function () {
      window.location.reload();
    });
  }
};
