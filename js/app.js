// js/app.js
var App = {
  state: {
    currentUser: null,
    isAdmin: false,
    currentTab: 'overview',
    password: ''
  },
  moduleRefs: {},

  NAV_ITEMS: [
    { id: 'overview',  label: '概览',     icon: '◆', module: 'modules/overview.js' },
    { id: 'teachers',  label: '教师管理', icon: '☰', module: 'modules/teachers.js' },
    { id: 'classes',   label: '班级浏览', icon: '⊞', module: 'modules/classes.js' },
    { id: 'feedback',  label: '反馈数据', icon: '◉', module: 'modules/feedback.js' },
    { id: 'templates', label: '模板管理', icon: '■', module: 'modules/templates.js' },
    { id: 'export',    label: '数据导出', icon: '⇧', module: 'modules/export.js' },
    { id: 'settings',  label: '操作日志', icon: '☷', module: 'modules/settings.js' }
  ],

  init: function () {
    var self = this;
    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', function () { self.handleLogin(); });
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', function () { self.handleLogout(); });
  },

  handleLogin: function () {
    var self = this;
    var btn = document.getElementById('login-btn');
    var errEl = document.getElementById('login-error');
    var pwdInput = document.getElementById('login-password');
    var password = pwdInput ? pwdInput.value : '';

    if (!password) { errEl.textContent = '请输入管理密码'; errEl.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = '验证中...'; errEl.style.display = 'none';

    Auth.login(password).then(function (result) {
      self.state.currentUser = { uid: 'admin' };
      self.state.isAdmin = true;
      self.state.password = result.password;
      self.showApp();
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = '登 录';
      errEl.textContent = e.message || '登录失败';
      errEl.style.display = 'block';
    });
  },

  handleLogout: function () { Auth.logout(); },

  // 模块可用的数据接口
  db: function (collection, query, limit) {
    return Auth.dbQuery(App.state.password, collection, query, limit);
  },
  count: function (collection, query) {
    return Auth.dbCount(App.state.password, collection, query);
  },
  callFunction: function (name, data) {
    return Auth.callFunction(App.state.password, name, data);
  },

  showApp: function () {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    this.buildNav();
    this.navigate('overview');
  },

  buildNav: function () {
    var self = this;
    var navList = document.getElementById('nav-list');
    navList.innerHTML = '';
    self.NAV_ITEMS.forEach(function (item) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="nav-icon">' + item.icon + '</span>' + item.label;
      li.addEventListener('click', function () { self.navigate(item.id); });
      navList.appendChild(li);
    });
  },

  navigate: function (tabId) {
    var self = this;
    self.state.currentTab = tabId;
    var items = document.querySelectorAll('#nav-list li');
    items.forEach(function (li, i) { li.classList.toggle('active', self.NAV_ITEMS[i] && self.NAV_ITEMS[i].id === tabId); });
    var navItem = self.NAV_ITEMS.find(function (n) { return n.id === tabId; });
    if (!navItem) return;
    var content = document.getElementById('content');
    if (self.moduleRefs[tabId]) {
      self.moduleRefs[tabId].render(self.state);
      return;
    }
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    var script = document.createElement('script');
    script.src = 'js/' + navItem.module;
    script.onload = function () {
      self.moduleRefs[tabId] = Module;
      if (Module && Module.render) Module.render(self.state);
    };
    script.onerror = function () { content.innerHTML = '<div class="empty-state"><p>模块加载失败</p></div>'; };
    document.head.appendChild(script);
  }
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function () { App.init(); }); }
else { App.init(); }
