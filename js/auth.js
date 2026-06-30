// js/auth.js
// 通过 HTTP 调用云函数，无需任何 SDK 或登录
var Auth = {
  // 云函数 HTTP 地址 — 部署后由用户更新
  API_URL: 'https://REPLACE_AFTER_DEPLOY.apigw.tcloudbase.com/admin-api',

  call: function (data) {
    return fetch(this.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('网络错误 ' + r.status);
      return r.json();
    });
  },

  login: function (password) {
    return this.call({ action: 'login', password: password }).then(function (res) {
      if (res.ok) {
        return { isAdmin: true, password: password };
      }
      throw new Error('密码错误');
    });
  },

  logout: function () {
    window.location.reload();
  }
};
