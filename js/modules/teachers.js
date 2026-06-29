// js/modules/teachers.js
// 教师管理模块 — 查询 teacher_profiles 集合，展示教师列表及筛选、详情弹窗
var Module = {
  render: function (tcb, state) {
    Utils.showLoading();

    var db = tcb.database();
    db.collection('teacher_profiles').get().then(function (res) {
      var teachers = res.data || [];
      var content = document.getElementById('content');
      Module.renderView(content, teachers);
    }).catch(function (err) {
      var content = document.getElementById('content');
      content.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
    });
  },

  renderView: function (content, teachers) {
    var html = '<h1 class="section-title">教师管理</h1>';

    // 搜索和筛选
    html += '<div class="search-bar">';
    html += '<input id="teacher-search" type="text" placeholder="搜索昵称...">';
    html += '<select id="teacher-grade-filter"><option value="">全部年级</option></select>';
    html += '<select id="teacher-subject-filter"><option value="">全部科目</option></select>';
    html += '</div>';

    // 教师列表
    html += '<div class="card">';
    if (teachers.length === 0) {
      html += '<div class="empty-state"><p>暂无教师数据</p></div>';
    } else {
      html += '<table><thead><tr><th>昵称</th><th>默认年级</th><th>默认科目</th><th>注册时间</th></tr></thead><tbody id="teacher-table-body"></tbody></table>';
    }
    html += '</div>';

    content.innerHTML = html;

    // 填充筛选下拉
    Module.populateFilters(teachers);

    // 渲染表格
    Module.renderTable(teachers);

    // 搜索事件
    document.getElementById('teacher-search').addEventListener('input', Utils.debounce(function () {
      Module.renderTable(teachers);
    }, 200));
    document.getElementById('teacher-grade-filter').addEventListener('change', function () {
      Module.renderTable(teachers);
    });
    document.getElementById('teacher-subject-filter').addEventListener('change', function () {
      Module.renderTable(teachers);
    });
  },

  populateFilters: function (teachers) {
    var grades = {};
    var subjects = {};
    teachers.forEach(function (t) {
      if (t.default_grade) grades[t.default_grade] = true;
      if (t.default_subject) subjects[t.default_subject] = true;
    });

    var gradeSelect = document.getElementById('teacher-grade-filter');
    Object.keys(grades).sort().forEach(function (g) {
      var opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      gradeSelect.appendChild(opt);
    });

    var subjectSelect = document.getElementById('teacher-subject-filter');
    Object.keys(subjects).sort().forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      subjectSelect.appendChild(opt);
    });
  },

  renderTable: function (teachers) {
    var body = document.getElementById('teacher-table-body');
    if (!body) return;

    var search = (document.getElementById('teacher-search') || {}).value || '';
    var gradeFilter = (document.getElementById('teacher-grade-filter') || {}).value || '';
    var subjectFilter = (document.getElementById('teacher-subject-filter') || {}).value || '';

    var filtered = teachers.filter(function (t) {
      var name = (t.nickname || '').toLowerCase();
      if (search && name.indexOf(search.toLowerCase()) === -1) return false;
      if (gradeFilter && t.default_grade !== gradeFilter) return false;
      if (subjectFilter && t.default_subject !== subjectFilter) return false;
      return true;
    });

    var html = '';
    filtered.forEach(function (t) {
      html += '<tr class="clickable-row" data-openid="' + Utils.escapeHtml(t._openid || '') + '">';
      html += '<td>' + Utils.escapeHtml(t.nickname || '-') + '</td>';
      html += '<td>' + Utils.escapeHtml(t.default_grade || '-') + '</td>';
      html += '<td>' + Utils.escapeHtml(t.default_subject || '-') + '</td>';
      html += '<td>' + Utils.formatDate(t.createTime) + '</td>';
      html += '</tr>';
    });
    body.innerHTML = html;

    // 点击行查看详情
    body.querySelectorAll('.clickable-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var openid = row.getAttribute('data-openid');
        var teacher = teachers.find(function (t) { return t._openid === openid; });
        if (teacher) Module.showDetail(teacher);
      });
    });
  },

  showDetail: function (teacher) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-header">' +
        '<span>教师档案</span>' +
        '<button class="modal-close">&times;</button>' +
      '</div>' +
      '<table>' +
        '<tr><td style="color:#94a3b8;width:80px">昵称</td><td>' + Utils.escapeHtml(teacher.nickname || '-') + '</td></tr>' +
        '<tr><td style="color:#94a3b8">默认年级</td><td>' + Utils.escapeHtml(teacher.default_grade || '-') + '</td></tr>' +
        '<tr><td style="color:#94a3b8">默认科目</td><td>' + Utils.escapeHtml(teacher.default_subject || '-') + '</td></tr>' +
        '<tr><td style="color:#94a3b8">签名</td><td>' + Utils.escapeHtml(teacher.signature || '-') + '</td></tr>' +
        '<tr><td style="color:#94a3b8">注册时间</td><td>' + Utils.formatDateTime(teacher.createTime) + '</td></tr>' +
      '</table>' +
    '</div>';

    overlay.querySelector('.modal-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }
};
