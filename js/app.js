// js/app.js
// 应用外壳 — CloudBase 初始化、认证、导航、模块动态加载
var App = {
  cloudbase: null,
  state: {
    currentUser: null,
    isAdmin: false,
    currentTab: 'overview'
  },
  moduleRefs: {},

  // 导航配置：id, label, icon, module script 路径
  NAV_ITEMS: [
    { id: 'overview',  label: '概览',     icon: '◆', module: 'modules/overview.js' },
    { id: 'teachers',  label: '教师管理', icon: '☰', module: 'modules/teachers.js' },
    { id: 'classes',   label: '班级浏览', icon: '⊞', module: 'modules/classes.js' },
    { id: 'feedback',  label: '反馈数据', icon: '◉', module: 'modules/feedback.js' },
    { id: 'templates', label: '模板管理', icon: '■', module: 'modules/templates.js' },
    { id: 'export',    label: '数据导出', icon: '⇧', module: 'modules/export.js' },
    { id: 'settings',  label: '操作日志', icon: '☷', module: 'modules/settings.js' }
  ],

  /**
   * 初始化应用
   */
  init: function () {
    var self = this;
    self.cloudbase = Auth.initCloudBase();

    // 登录按钮
    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        self.handleLogin();
      });
    }

    // 退出按钮
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        self.handleLogout();
      });
    }
  },

  /**
   * 处理登录
   */
  handleLogin: function () {
    var self = this;
    var btn = document.getElementById('login-btn');
    var errEl = document.getElementById('login-error');
    var password = document.getElementById('login-password').value;

    if (!password) {
      errEl.textContent = '请输入管理密码';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = '验证中...';
    errEl.style.display = 'none';

    Auth.login(password).then(function (result) {
      self.state.currentUser = { uid: 'admin' };
      self.state.isAdmin = true;
      self.showApp();
    }).catch(function (e) {
      btn.disabled = false;
      btn.textContent = '登 录';
      if (e.message === 'wrong_password') {
        errEl.textContent = '密码错误';
      } else {
        errEl.textContent = '登录失败，请重试';
      }
      errEl.style.display = 'block';
    });
  },

  /**
   * 处理登出
   */
  handleLogout: function () {
    Auth.logout();
  },

  /**
   * 显示应用外壳，构建导航，进入概览页
   */
  showApp: function () {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    this.buildNav();
    this.navigate('overview');
  },

  /**
   * 根据 NAV_ITEMS 动态构建侧边导航
   */
  buildNav: function () {
    var self = this;
    var navList = document.getElementById('nav-list');
    navList.innerHTML = '';
    self.NAV_ITEMS.forEach(function (item) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="nav-icon">' + item.icon + '</span>' + item.label;
      li.addEventListener('click', function () {
        self.navigate(item.id);
      });
      navList.appendChild(li);
    });
  },

  /**
   * 切换到指定标签页，按需动态加载模块脚本
   * @param {string} tabId — 对应 NAV_ITEMS 中的 id
   */
  navigate: function (tabId) {
    var self = this;
    self.state.currentTab = tabId;

    // 更新导航高亮
    var items = document.querySelectorAll('#nav-list li');
    items.forEach(function (li, i) {
      li.classList.toggle('active', self.NAV_ITEMS[i] && self.NAV_ITEMS[i].id === tabId);
    });

    var navItem = self.NAV_ITEMS.find(function (n) { return n.id === tabId; });
    if (!navItem) return;

    var content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // 若模块已加载，直接使用缓存引用，无需重新创建 script 标签
    if (self.moduleRefs[tabId]) {
      self.moduleRefs[tabId].render(self.cloudbase, self.state);
      return;
    }

    // 动态加载模块脚本
    var script = document.createElement('script');
    script.src = 'js/' + navItem.module;
    script.onload = function () {
      // 立即保存模块引用，防止后续模块加载覆盖全局 Module 变量
      self.moduleRefs[tabId] = Module;
      if (Module && typeof Module.render === 'function') {
        Module.render(self.cloudbase, self.state);
      }
    };
    script.onerror = function () {
      content.innerHTML = '<div class="empty-state"><p>模块加载失败</p></div>';
    };
    document.head.appendChild(script);
  }
};

// 启动应用（兼容 DOM 已就绪的情况）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });
} else {
  App.init();
}
