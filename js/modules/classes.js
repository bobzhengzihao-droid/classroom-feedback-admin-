// js/modules/classes.js
// 班级浏览模块 — 查询 user_data 集合获取所有教师的班级数据，按教师分组展示
var Module = {
  render: function (tcb, state) {
    var content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    var db = tcb.database();

    // 查询所有教师的班级数据
    db.collection('user_data')
      .where({ key: db.RegExp({ regexp: '.*\\|classes$' }) })
      .get()
      .then(function (res) {
        var userClasses = res.data || [];
        // 同时获取教师档案
        return db.collection('teacher_profiles').get().then(function (profileRes) {
          var profiles = profileRes.data || [];
          Module.renderView(content, userClasses, profiles);
        });
      })
      .catch(function (err) {
        content.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
      });
  },

  renderView: function (content, userClasses, profiles) {
    var html = '<h1 class="section-title">班级浏览</h1>';

    // 按教师组织数据
    var allClasses = [];
    userClasses.forEach(function (doc) {
      var classes = doc.value;
      if (!Array.isArray(classes)) return;
      // 从 key 提取 openid：key 格式为 "openid|classes"
      var keyParts = doc.key.split('|');
      var openid = keyParts[0];
      var teacher = profiles.find(function (p) { return p._openid === openid; }) || {};
      classes.forEach(function (cls) {
        allClasses.push({
          teacherName: teacher.nickname || openid || '未知',
          teacherOpenid: openid,
          teacher: teacher,
          cls: cls
        });
      });
    });

    // 搜索
    html += '<div class="search-bar">';
    html += '<input id="class-search" type="text" placeholder="搜索班级名、教师名...">';
    html += '<select id="class-grade-filter"><option value="">全部年级</option></select>';
    html += '<select id="class-subject-filter"><option value="">全部科目</option></select>';
    html += '</div>';

    html += '<div id="class-list-container"></div>';
    content.innerHTML = html;

    // 填充筛选
    var gradeSet = {}, subjectSet = {};
    allClasses.forEach(function (item) {
      if (item.cls.grade) gradeSet[item.cls.grade] = true;
      if (item.cls.subject) subjectSet[item.cls.subject] = true;
    });
    function fillSelect(id, values) {
      var sel = document.getElementById(id);
      Object.keys(values).sort().forEach(function (v) {
        var opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      });
    }
    fillSelect('class-grade-filter', gradeSet);
    fillSelect('class-subject-filter', subjectSet);

    // 事件
    var filterFn = function () {
      Module.renderClassList(allClasses);
    };
    document.getElementById('class-search').addEventListener('input', Utils.debounce(filterFn, 200));
    document.getElementById('class-grade-filter').addEventListener('change', filterFn);
    document.getElementById('class-subject-filter').addEventListener('change', filterFn);

    Module.renderClassList(allClasses);
  },

  renderClassList: function (allClasses) {
    var container = document.getElementById('class-list-container');
    var search = (document.getElementById('class-search') || {}).value || '';
    var gFilter = (document.getElementById('class-grade-filter') || {}).value || '';
    var sFilter = (document.getElementById('class-subject-filter') || {}).value || '';

    var filtered = allClasses.filter(function (item) {
      if (search) {
        var q = search.toLowerCase();
        if (item.teacherName.toLowerCase().indexOf(q) === -1 &&
            (item.cls.name || '').toLowerCase().indexOf(q) === -1) return false;
      }
      if (gFilter && item.cls.grade !== gFilter) return false;
      if (sFilter && item.cls.subject !== sFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无班级数据</p></div>';
      return;
    }

    // 按教师分组
    var groups = {};
    filtered.forEach(function (item) {
      var key = item.teacherOpenid;
      if (!groups[key]) groups[key] = { teacherName: item.teacherName, items: [] };
      groups[key].items.push(item);
    });

    var html = '';
    Object.keys(groups).forEach(function (openid) {
      var g = groups[openid];
      html += '<div class="card">';
      html += '<div class="card-header">' + Utils.escapeHtml(g.teacherName) + ' <span class="badge badge-blue">' + g.items.length + ' 个班级</span></div>';
      html += '<table><thead><tr><th>年级</th><th>科目</th><th>学生数</th><th>反馈维度</th></tr></thead><tbody>';
      g.items.forEach(function (item) {
        var c = item.cls;
        var studentCount = (c.students && c.students.length) || 0;
        var colNames = (c.columns || []).map(function (col) { return col.name || ''; }).filter(Boolean).join('、') || '-';
        html += '<tr class="clickable-row" data-cls=\'' + JSON.stringify({ openid: openid, clsId: c.id, students: c.students || [] }) + '\'>';
        html += '<td>' + Utils.escapeHtml(c.grade || '-') + '</td>';
        html += '<td>' + Utils.escapeHtml(c.subject || '-') + '</td>';
        html += '<td>' + studentCount + '</td>';
        html += '<td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + Utils.escapeHtml(colNames) + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '</div>';
    });

    container.innerHTML = html;

    // 点击行查看学生
    container.querySelectorAll('.clickable-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var data = JSON.parse(row.getAttribute('data-cls'));
        Module.showStudents(data.openid, data.clsId, data.students);
      });
    });
  },

  showStudents: function (openid, clsId, students) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    var html = '<div class="modal">' +
      '<div class="modal-header"><span>学生列表</span><button class="modal-close">&times;</button></div>';

    if (!students || students.length === 0) {
      html += '<div class="empty-state"><p>暂无学生</p></div>';
    } else {
      html += '<table><tbody>';
      students.forEach(function (name, i) {
        html += '<tr><td style="color:#94a3b8;width:40px">' + (i + 1) + '</td><td>' + Utils.escapeHtml(name || '-') + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelector('.modal-close').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }
};
