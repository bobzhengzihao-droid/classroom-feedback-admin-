// js/modules/settings.js
// 操作日志查看 — 查询 admin_logs 集合，展示最近操作记录
var Module = {
  render: function (tcb, state) {
    var content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    var db = tcb.database();
    db.collection('admin_logs').orderBy('createdAt', 'desc').limit(200).get().then(function (res) {
      var logs = res.data || [];
      Module.renderView(content, logs);
    }).catch(function (err) {
      content.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
    });
  },

  renderView: function (content, logs) {
    var html = '<h1 class="section-title">操作日志</h1>';
    html += '<div class="card">';

    if (logs.length === 0) {
      html += '<div class="empty-state"><p>暂无操作记录</p></div>';
    } else {
      html += '<table><thead><tr><th>时间</th><th>操作类型</th><th>操作目标</th><th>结果</th></tr></thead><tbody>';
      logs.forEach(function (log) {
        var actionLabel = log.action || '-';
        html += '<tr>';
        html += '<td>' + Utils.formatDateTime(log.createdAt) + '</td>';
        html += '<td><span class="badge badge-blue">' + Utils.escapeHtml(actionLabel) + '</span></td>';
        html += '<td>' + Utils.escapeHtml(log.target || '-') + '</td>';
        html += '<td><span class="badge ' + (log.result === 'success' ? 'badge-green' : 'badge-blue') + '">' + Utils.escapeHtml(log.result || '-') + '</span></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '<p style="font-size:12px;color:#94a3b8;margin-top:8px">显示最近 ' + logs.length + ' 条记录</p>';
    }

    html += '</div>';
    content.innerHTML = html;
  }
};
