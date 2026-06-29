// js/modules/overview.js
// 概览仪表盘 — 统计卡片、活跃教师、最近操作日志
var Module = {
  render: function (tcb, state) {
    Utils.showLoading();
    this.loadData(tcb);
  },

  loadData: function (tcb) {
    var db = tcb.database();
    var content = document.getElementById('content');
    var self = this;

    // 并行查询：教师数、班级数据、操作日志、教师列表
    Promise.all([
      db.collection('teacher_profiles').count(),
      db.collection('user_data')
        .where({ key: db.RegExp({ regexp: '.*\\|classes$' }) })
        .get(),
      db.collection('admin_logs').orderBy('createdAt', 'desc').limit(10).get(),
      db.collection('teacher_profiles').get()
    ]).then(function (results) {
      var teacherCount = (results[0] && results[0].total) || 0;
      var classesResult = results[1];
      var adminLogs = (results[2] && results[2].data) || [];
      var teachers = (results[3] && results[3].data) || [];

      // 统计班级数：从 user_data 中提取所有 class 对象，按 id 去重
      var classCount = 0;
      var classMap = {};
      (classesResult && classesResult.data || []).forEach(function (doc) {
        var value = doc.value;
        if (Array.isArray(value)) {
          value.forEach(function (cls) {
            if (cls && cls.id) {
              classMap[cls.id] = cls;
            }
          });
        }
      });
      classCount = Object.keys(classMap).length;

      // 统计反馈条目数（单独查询，避免与正则查询混合）
      db.collection('user_data')
        .where({ key: db.RegExp({ regexp: '.*\\|fb\\|.*' }) })
        .count()
        .then(function (fbRes) {
          var feedbackCount = (fbRes && fbRes.total) || 0;
          self.renderDashboard(content, teacherCount, classCount, feedbackCount, teachers, adminLogs);
        })
        .catch(function () {
          // 反馈统计失败时降级显示 0
          self.renderDashboard(content, teacherCount, classCount, 0, teachers, adminLogs);
        });
    }).catch(function (err) {
      content.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
    });
  },

  renderDashboard: function (content, teacherCount, classCount, feedbackCount, teachers, adminLogs) {
    // 按最近更新时间排序教师，取前10
    var recentTeachers = teachers
      .sort(function (a, b) {
        return (b._updateTime || b.createTime || 0) - (a._updateTime || a.createTime || 0);
      })
      .slice(0, 10);

    var html = '<h1 class="section-title">概览</h1>';

    // 统计卡片
    html += '<div class="stat-grid">';
    html += '<div class="stat-card"><div class="stat-value">' + teacherCount + '</div><div class="stat-label">教师总数</div></div>';
    html += '<div class="stat-card"><div class="stat-value">' + classCount + '</div><div class="stat-label">班级总数</div></div>';
    html += '<div class="stat-card"><div class="stat-value">' + feedbackCount + '</div><div class="stat-label">反馈条目</div></div>';
    html += '<div class="stat-card"><div class="stat-value">' + adminLogs.length + '</div><div class="stat-label">近期操作</div></div>';
    html += '</div>';

    // 最近活跃教师
    html += '<div class="card"><div class="card-header">最近活跃教师</div>';
    if (recentTeachers.length === 0) {
      html += '<div class="empty-state"><p>暂无数据</p></div>';
    } else {
      html += '<table><thead><tr><th>昵称</th><th>默认年级</th><th>默认科目</th></tr></thead><tbody>';
      recentTeachers.forEach(function (t) {
        html += '<tr><td>' + Utils.escapeHtml(t.nickname || '-') + '</td>';
        html += '<td>' + Utils.escapeHtml(t.default_grade || '-') + '</td>';
        html += '<td>' + Utils.escapeHtml(t.default_subject || '-') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    // 最近操作日志
    html += '<div class="card"><div class="card-header">最近操作日志</div>';
    if (adminLogs.length === 0) {
      html += '<div class="empty-state"><p>暂无操作记录</p></div>';
    } else {
      html += '<table><thead><tr><th>时间</th><th>操作</th><th>对象</th></tr></thead><tbody>';
      adminLogs.forEach(function (log) {
        html += '<tr><td>' + Utils.formatDateTime(log.createdAt) + '</td>';
        html += '<td><span class="badge badge-blue">' + Utils.escapeHtml(log.action || '-') + '</span></td>';
        html += '<td>' + Utils.escapeHtml(log.target || '-') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    content.innerHTML = html;
  }
};
