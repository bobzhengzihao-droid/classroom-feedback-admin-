// js/app.js
var App = {
  cloudbase: null,
  state: {
    currentUser: null,
    isAdmin: false,
    currentTab: 'overview'
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

    if (!window.cloudbase) {
      document.getElementById('login-error').textContent = 'SDK 加载失败，请刷新';
      document.getElementById('login-error').style.display = 'block';
      return;
    }

    self.cloudbase = Auth.initCloudBase();

    // 检查是否已登录（扫码回调后）
    var auth = self.cloudbase.auth({ persistence: 'local' });
    auth.getLoginState().then(function (state) {
      if (state && state.user) {
        Auth.checkAdmin(state.user.uid).then(function (isAdmin) {
          if (isAdmin) {
            self.state.currentUser = { uid: state.user.uid };
            self.state.isAdmin = true;
            self.showApp();
          }
        });
      }
    });

    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () { self.handleLogin(); });
    }
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () { self.handleLogout(); });
    }
  },

  handleLogin: function () {
    var self = this;
    var btn = document.getElementById('login-btn');
    var errEl = document.getElementById('login-error');
    btn.disabled = true;
    btn.textContent = '跳转中...';
    errEl.style.display = 'none';

    Auth.login().then(function (result) {
      self.state.currentUser = { uid: result.openid || 'admin' };
      self.state.isAdmin = true;
      self.showApp();
    }).catch(function (e) {
      btn.disabled = false;
      btn.textContent = '微信扫码登录';
      errEl.textContent = e.message || '登录失败';
      errEl.style.display = 'block';
    });
  },

  handleLogout: function () {
    Auth.logout();
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
    items.forEach(function (li, i) {
      li.classList.toggle('active', self.NAV_ITEMS[i] && self.NAV_ITEMS[i].id === tabId);
    });

    var navItem = self.NAV_ITEMS.find(function (n) { return n.id === tabId; });
    if (!navItem) return;

    var content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    if (self.moduleRefs[tabId]) {
      self.moduleRefs[tabId].render(self.state);
      return;
    }

    var script = document.createElement('script');
    script.src = 'js/' + navItem.module;
    script.onload = function () {
      self.moduleRefs[tabId] = Module;
      if (Module && typeof Module.render === 'function') {
        Module.render(self.state);
      }
    };
    script.onerror = function () {
      content.innerHTML = '<div class="empty-state"><p>模块加载失败</p></div>';
    };
    document.head.appendChild(script);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { App.init(); });
} else {
  App.init();
}
