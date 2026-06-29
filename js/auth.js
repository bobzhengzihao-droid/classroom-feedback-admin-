// js/auth.js
var Auth = {
  ADMIN_COLLECTION: 'admins',

  initCloudBase: function () {
    var cloudbase = window.cloudbase;
    if (!cloudbase) {
      console.error('[Auth] CloudBase SDK 未加载');
      return null;
    }
    return cloudbase.init({
      env: 'cloudbase-d3gqm8sr8db1d7582'
    });
  },

  login: function (password) {
    var self = this;
    var tcb = App.cloudbase;
    if (!tcb) {
      return Promise.reject(new Error('SDK 未初始化'));
    }
    var db = tcb.database();
    if (!db) {
      return Promise.reject(new Error('数据库不可用'));
    }
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
    window.location.reload();
  }
};
