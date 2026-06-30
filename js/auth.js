// js/auth.js
var Auth = {
  API_URL: 'https://cloudbase-d3gqm8sr8db1d7582-1438325887.ap-shanghai.app.tcloudbase.com/admin-api',

  call: function (data) {
    return fetch(this.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (json) {
      if (json.error) throw new Error(json.error);
      return json;
    });
  },

  login: function (password) {
    return this.call({ action: 'login', password: password }).then(function (res) {
      if (res.ok) return { isAdmin: true, password: password };
      throw new Error('密码错误');
    });
  },

  dbQuery: function (password, collection, query, limit) {
    return this.call({ action: 'query', password: password, collection: collection, query: query || {}, limit: limit || 100 });
  },
  dbCount: function (password, collection, query) {
    return this.call({ action: 'count', password: password, collection: collection, query: query || {} });
  },
  callFunction: function (password, funcName, funcData) {
    return this.call({ action: 'callFunction', password: password, funcName: funcName, funcData: funcData });
  },

  logout: function () { window.location.reload(); }
};
