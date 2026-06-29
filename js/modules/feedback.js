// js/modules/feedback.js
// 反馈数据查看模块 — 教师→班级→课次级联选择，只读反馈表格渲染
var Module = {
  render: function (tcb, state) {
    var content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    var db = tcb.database();

    // 获取所有教师的班级数据
    db.collection('user_data')
      .where({ key: db.RegExp({ regexp: '.*\\|classes$' }) })
      .get()
      .then(function (res) {
        var allData = Module.buildTeacherClassMap(res.data || []);
        Module.renderView(content, db, allData);
      })
      .catch(function (err) {
        content.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
      });
  },

  /**
   * 从 user_data 原始数据构建教师→班级映射
   * 每个文档 key 格式为 "openid|classes"，value 为班级数组
   */
  buildTeacherClassMap: function (userClassesData) {
    var map = {};
    userClassesData.forEach(function (doc) {
      var parts = (doc.key || '').split('|');
      var openid = parts[0];
      if (!openid) return;
      var classes = Array.isArray(doc.value) ? doc.value : [];
      if (!map[openid]) map[openid] = [];
      classes.forEach(function (c) {
        map[openid].push({ id: c.id, name: (c.grade || '') + ' · ' + (c.subject || '') });
      });
    });
    return map;
  },

  /**
   * 渲染主视图：级联下拉框 + 加载按钮 + 反馈表格容器
   * 异步获取教师档案以填充教师下拉
   */
  renderView: function (content, db, allData) {
    var html = '<h1 class="section-title">反馈数据</h1>';

    // 级联选择栏
    html += '<div class="search-bar">';
    html += '<select id="fb-teacher"><option value="">选择教师</option></select>';
    html += '<select id="fb-class"><option value="">选择班级</option></select>';
    html += '<select id="fb-date"><option value="">选择课次</option></select>';
    html += '</div>';

    // 加载按钮
    html += '<div style="margin-bottom:16px">';
    html += '<button id="fb-load-btn" class="btn-primary btn-small" disabled>查看反馈</button>';
    html += '<span id="fb-load-status" style="margin-left:12px;font-size:12px;color:#94a3b8;display:none"></span>';
    html += '</div>';

    // 反馈表格容器
    html += '<div id="fb-grid-container"></div>';

    content.innerHTML = html;

    var teacherSelect = document.getElementById('fb-teacher');
    var classSelect = document.getElementById('fb-class');
    var dateSelect = document.getElementById('fb-date');
    var loadBtn = document.getElementById('fb-load-btn');
    var loadStatus = document.getElementById('fb-load-status');

    // 异步获取教师档案，填充教师下拉
    db.collection('teacher_profiles').get().then(function (res) {
      var profiles = res.data || [];
      // 只显示有班级的教师（若需显示全部教师，去掉此过滤即可）
      profiles.forEach(function (t) {
        var openid = t._openid;
        // 未在 allData 中找到该教师的班级也仍然显示（管理员可能想查看但暂未创建班级）
        var opt = document.createElement('option');
        opt.value = openid;
        opt.textContent = (t.nickname || openid || '未知');
        teacherSelect.appendChild(opt);
      });
    }).catch(function () {
      // 教师档案加载失败，下拉保持空（不影响班级数据查看）
    });

    // 教师变化 → 填充班级下拉
    teacherSelect.addEventListener('change', function () {
      classSelect.innerHTML = '<option value="">选择班级</option>';
      dateSelect.innerHTML = '<option value="">选择课次</option>';
      loadBtn.disabled = true;
      document.getElementById('fb-grid-container').innerHTML = '';

      var openid = teacherSelect.value;
      if (!openid) return;
      var classes = allData[openid] || [];
      classes.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        classSelect.appendChild(opt);
      });
    });

    // 班级变化 → 查询该班级所有课次标签
    classSelect.addEventListener('change', function () {
      var classId = classSelect.value;
      var openid = teacherSelect.value;
      dateSelect.innerHTML = '<option value="">加载课次...</option>';
      loadBtn.disabled = true;
      document.getElementById('fb-grid-container').innerHTML = '';

      if (!classId || !openid) {
        dateSelect.innerHTML = '<option value="">选择课次</option>';
        return;
      }

      var prefix = openid + '|fb|' + classId + '|';
      db.collection('user_data')
        .where({ key: db.RegExp({ regexp: '^' + Module.escapeRegex(prefix) }) })
        .get()
        .then(function (res) {
          dateSelect.innerHTML = '<option value="">选择课次</option>';
          var docs = res.data || [];
          docs.forEach(function (doc) {
            var dateLabel = (doc.key || '').substring(prefix.length);
            if (dateLabel) {
              var opt = document.createElement('option');
              opt.value = dateLabel;
              opt.textContent = dateLabel;
              dateSelect.appendChild(opt);
            }
          });
          if (docs.length === 0) {
            dateSelect.innerHTML = '<option value="">无课次数据</option>';
          }
        })
        .catch(function () {
          dateSelect.innerHTML = '<option value="">加载失败</option>';
        });
    });

    // 日期变化 → 启用加载按钮
    dateSelect.addEventListener('change', function () {
      loadBtn.disabled = !dateSelect.value;
    });

    // 加载反馈数据
    loadBtn.addEventListener('click', function () {
      var openid = teacherSelect.value;
      var classId = classSelect.value;
      var dateLabel = dateSelect.value;
      if (!openid || !classId || !dateLabel) return;

      var container = document.getElementById('fb-grid-container');
      container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      loadBtn.disabled = true;
      loadStatus.style.display = 'inline';
      loadStatus.textContent = '加载中...';

      var key = openid + '|fb|' + classId + '|' + dateLabel;
      db.collection('user_data').where({ key: key }).get().then(function (res) {
        loadStatus.style.display = 'none';
        loadBtn.disabled = false;
        if (res.data && res.data.length > 0) {
          Module.renderGrid(container, res.data[0].value);
        } else {
          container.innerHTML = '<div class="empty-state"><p>该课次无反馈数据</p></div>';
        }
      }).catch(function (err) {
        loadStatus.style.display = 'none';
        loadBtn.disabled = false;
        container.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
      });
    });
  },

  /**
   * 转义正则特殊字符，用于构建 db.RegExp 安全查询
   */
  escapeRegex: function (str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * 渲染只读反馈表格
   * 兼容 columns / dateColumns 两种列定义，
   * 兼容 records 数组和 cells 映射两种数据格式
   */
  renderGrid: function (container, entry) {
    if (!entry) {
      container.innerHTML = '<div class="empty-state"><p>无数据</p></div>';
      return;
    }

    var columns = entry.columns || entry.dateColumns || [];
    var records = entry.records || [];
    var cells = entry.cells || {};

    // 若 records 为空但 cells 有数据，从 cells 重建 records
    if (Object.keys(cells).length > 0 && records.length === 0) {
      var maxRow = -1, maxCol = -1;
      Object.keys(cells).forEach(function (ck) {
        var parts = ck.split('-');
        var r = parseInt(parts[0], 10);
        var c = parseInt(parts[1], 10);
        if (!isNaN(r) && r > maxRow) maxRow = r;
        if (!isNaN(c) && c > maxCol) maxCol = c;
      });
      for (var r = 0; r <= maxRow; r++) {
        var vals = [], cols = [];
        for (var co = 0; co <= maxCol; co++) {
          var cell = cells[r + '-' + co];
          vals.push(cell ? (cell.v || '') : '');
          cols.push(cell ? (cell.c || '') : '');
        }
        records.push({ name: '', values: vals, colors: cols });
      }
      if (!columns.length) {
        for (var ci = 0; ci <= maxCol; ci++) columns.push({ name: '', maxScore: 0 });
      }
    }

    if (records.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>该课次无学生数据</p></div>';
      return;
    }

    var html = '<div class="feedback-table-wrapper"><table class="feedback-table"><thead><tr>';
    html += '<th style="min-width:80px">学生</th>';
    columns.forEach(function (col) {
      html += '<th style="min-width:100px">' + Utils.escapeHtml(col.name || '-') + '</th>';
    });
    html += '</tr></thead><tbody>';

    records.forEach(function (rec, ri) {
      html += '<tr>';
      html += '<td style="font-weight:500">' + Utils.escapeHtml(rec.name || ('行' + (ri + 1))) + '</td>';
      (rec.values || []).forEach(function (v, ci) {
        var color = (rec.colors && rec.colors[ci]) || '';
        var bgStyle = color ? 'background:' + color + ';color:#fff;border-radius:4px;padding:2px 6px;display:inline-block' : '';
        html += '<td><span style="' + bgStyle + '">' + Utils.escapeHtml(v || '') + '</span></td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }
};
