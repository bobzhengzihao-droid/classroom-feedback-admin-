// js/auth.js
// CloudBase 认证模块 — 初始化、登录/登出、管理员白名单校验
var Auth = {
  ADMIN_COLLECTION: 'admins',

  /**
   * 初始化 CloudBase 实例
   * @returns {Object} tcb 实例
   */
  initCloudBase: function () {
    var tcb = window.cloudbase;
    var app = tcb.init({
      env: 'cloudbase-d3gqm8sr8db1d7582'
    });
    return app;
  },

  /**
   * 检查 openid 是否在管理员白名单中
   * @param {string} openid
   * @returns {Promise<boolean>}
   */
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

  /**
   * 触发登录流程：跳转默认登录页 → 获取登录态 → 校验管理员
   * @returns {Promise<{openid: string, isAdmin: boolean}>}
   */
  login: function () {
    var self = this;
    var auth = App.cloudbase.auth({ persistence: 'local' });

    // CloudBase Web SDK 扫码登录：跳转到云开发内置登录页
    try {
      return auth.toDefaultLoginPage({ redirectUrl: window.location.href })
        .then(function (loginState) {
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
    } catch (e) {
      // 如果 toDefaultLoginPage 不可用，直接跳转云开发登录页
      return auth.signInWithRedirect({ loginType: 'WECHAT' });
    }
  },

  /**
   * 获取当前登录状态（静默，不跳转页面）
   * @returns {Promise<Object|null>}
   */
  getLoginState: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    return auth.getLoginState();
  },

  /**
   * 登出
   * @returns {Promise<void>}
   */
  logout: function () {
    var auth = App.cloudbase.auth({ persistence: 'local' });
    return auth.signOut();
  }
};
