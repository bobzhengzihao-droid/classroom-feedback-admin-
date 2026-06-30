var Module = {
  render: function (state) {
    var c = document.getElementById('content');
    c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    App.db('admin_logs', {}, 200).then(function (r) {
      var logs = r.data || []; Module.renderView(c, logs);
    }).catch(function (e) {
      c.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(e.message || e)) + '</p></div>';
    });
  },
  renderView: function (c, logs) {
    var h = '<h1 class="section-title">操作日志</h1><div class="card">';
    if (!logs.length) { h += '<div class="empty-state"><p>暂无操作记录</p></div>'; }
    else {
      h += '<table><thead><tr><th>时间</th><th>操作类型</th><th>操作目标</th><th>结果</th></tr></thead><tbody>';
      logs.forEach(function (log) {
        h += '<tr><td>' + Utils.formatDateTime(log.createdAt) + '</td><td><span class="badge badge-blue">' + Utils.escapeHtml(log.action || '-') + '</span></td><td>' + Utils.escapeHtml(log.target || '-') + '</td><td><span class="badge ' + (log.result === 'success' ? 'badge-green' : 'badge-blue') + '">' + Utils.escapeHtml(log.result || '-') + '</span></td></tr>';
      });
      h += '</tbody></table><p style="font-size:12px;color:#94a3b8;margin-top:8px">显示最近 ' + logs.length + ' 条记录</p>';
    }
    h += '</div>'; c.innerHTML = h;
  }
};
