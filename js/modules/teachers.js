var Module = {
  render: function (state) {
    var c = document.getElementById('content');
    c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    App.db('teacher_profiles', {}, 500).then(function (r) {
      var t = r.data || [];
      Module.renderView(c, t);
    }).catch(function (e) {
      c.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(e.message || e)) + '</p></div>';
    });
  },
  renderView: function (c, t) {
    var h = '<h1 class="section-title">教师管理</h1>';
    h += '<div class="search-bar"><input id="ts" type="text" placeholder="搜索昵称..."><select id="tg"><option value="">全部年级</option></select><select id="tsub"><option value="">全部科目</option></select></div>';
    h += '<div class="card">';
    if (!t.length) { h += '<div class="empty-state"><p>暂无教师数据</p></div>'; }
    else { h += '<table><thead><tr><th>昵称</th><th>默认年级</th><th>默认科目</th><th>注册时间</th></tr></thead><tbody id="tb"></tbody></table>'; }
    h += '</div>';
    c.innerHTML = h;
    var gs = {}, ss = {};
    t.forEach(function (x) { if (x.default_grade) gs[x.default_grade] = 1; if (x.default_subject) ss[x.default_subject] = 1; });
    Object.keys(gs).sort().forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; document.getElementById('tg').appendChild(o); });
    Object.keys(ss).sort().forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; document.getElementById('tsub').appendChild(o); });
    var render = function () { Module.renderTable(t); };
    document.getElementById('ts').addEventListener('input', Utils.debounce(render, 200));
    document.getElementById('tg').addEventListener('change', render);
    document.getElementById('tsub').addEventListener('change', render);
    Module.renderTable(t);
  },
  renderTable: function (t) {
    var b = document.getElementById('tb'); if (!b) return;
    var s = (document.getElementById('ts') || {}).value || '', gf = (document.getElementById('tg') || {}).value || '', sf = (document.getElementById('tsub') || {}).value || '';
    var f = t.filter(function (x) {
      if (s && (x.nickname || '').toLowerCase().indexOf(s.toLowerCase()) === -1) return false;
      if (gf && x.default_grade !== gf) return false;
      if (sf && x.default_subject !== sf) return false;
      return true;
    });
    var h = '';
    f.forEach(function (x) {
      h += '<tr class="clickable-row" data-oi="' + Utils.escapeHtml(x._openid || '') + '"><td>' + Utils.escapeHtml(x.nickname || '-') + '</td><td>' + Utils.escapeHtml(x.default_grade || '-') + '</td><td>' + Utils.escapeHtml(x.default_subject || '-') + '</td><td>' + Utils.formatDate(x.createTime) + '</td></tr>';
    });
    b.innerHTML = h;
    b.querySelectorAll('.clickable-row').forEach(function (r) {
      r.addEventListener('click', function () {
        var oi = r.getAttribute('data-oi');
        var x = t.find(function (d) { return d._openid === oi; });
        if (x) Module.showDetail(x);
      });
    });
  },
  showDetail: function (x) {
    var ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = '<div class="modal"><div class="modal-header"><span>教师档案</span><button class="modal-close">&times;</button></div><table><tr><td style="color:#94a3b8;width:80px">昵称</td><td>' + Utils.escapeHtml(x.nickname || '-') + '</td></tr><tr><td style="color:#94a3b8">默认年级</td><td>' + Utils.escapeHtml(x.default_grade || '-') + '</td></tr><tr><td style="color:#94a3b8">默认科目</td><td>' + Utils.escapeHtml(x.default_subject || '-') + '</td></tr><tr><td style="color:#94a3b8">签名</td><td>' + Utils.escapeHtml(x.signature || '-') + '</td></tr><tr><td style="color:#94a3b8">注册时间</td><td>' + Utils.formatDateTime(x.createTime) + '</td></tr></table></div>';
    ov.querySelector('.modal-close').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }
};
