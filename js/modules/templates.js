var Module = {
  render: function (state) {
    var c = document.getElementById('content');
    c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    Promise.all([App.db('user_data', { keyPrefix: '.*\\|template\\|.*' }, 500), App.db('teacher_profiles', {}, 500)])
      .then(function (r) { var t = r[0].data || [], p = r[1].data || []; Module.renderView(c, t, p); })
      .catch(function (e) { c.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(e.message || e)) + '</p></div>'; });
  },
  renderView: function (c, t, p) {
    var h = '<h1 class="section-title">模板管理</h1>';
    h += '<div class="card"><div class="card-header">预设模板</div>';
    if (!t.length) { h += '<div class="empty-state"><p>暂无模板</p></div>'; }
    else {
      h += '<table><thead><tr><th>年级-科目</th><th>教师</th><th>操作</th></tr></thead><tbody>';
      t.forEach(function (d) {
        var parts = d.key.split('|'), gs = parts.slice(2).join('|'), oo = parts[0];
        var pt = p.find(function (x) { return x._openid === oo; }), tn = pt ? pt.nickname : oo;
        h += '<tr><td>' + Utils.escapeHtml(gs) + '</td><td>' + Utils.escapeHtml(tn) + '</td>';
        h += '<td><button class="btn-primary btn-small push-btn" data-k="' + Utils.escapeHtml(d.key) + '" data-gs="' + Utils.escapeHtml(gs) + '">推送给教师</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div>'; c.innerHTML = h;
    c.querySelectorAll('.push-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { Module.showPush(btn.getAttribute('data-k'), btn.getAttribute('data-gs'), p); });
    });
  },
  showPush: function (tk, gs, p) {
    var ov = document.createElement('div'); ov.className = 'modal-overlay';
    var h = '<div class="modal"><div class="modal-header"><span>推送模板: ' + Utils.escapeHtml(gs) + '</span><button class="modal-close">&times;</button></div>';
    h += '<p style="font-size:13px;color:#64748b;margin-bottom:12px">选择目标教师</p>';
    h += '<div class="search-bar"><input id="pts" type="text" placeholder="搜索教师..."></div><div class="checkbox-list" id="tcl">';
    p.forEach(function (x) { h += '<label class="checkbox-item"><input type="checkbox" value="' + Utils.escapeHtml(x._openid || '') + '"> ' + Utils.escapeHtml(x.nickname || x._openid || '') + ' (' + Utils.escapeHtml(x.default_grade || '-') + ' · ' + Utils.escapeHtml(x.default_subject || '-') + ')</label>'; });
    h += '</div><div style="margin-top:16px;display:flex;gap:8px;align-items:center"><button id="pcb" class="btn-primary">确认推送</button><span id="prs" style="font-size:13px"></span></div></div>';
    ov.innerHTML = h; document.body.appendChild(ov);
    ov.querySelector('.modal-close').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.getElementById('pts').addEventListener('input', Utils.debounce(function () {
      var q = (document.getElementById('pts').value || '').toLowerCase();
      ov.querySelectorAll('.checkbox-item').forEach(function (l) { l.style.display = l.textContent.toLowerCase().indexOf(q) >= 0 ? 'flex' : 'none'; });
    }, 200));
    document.getElementById('pcb').addEventListener('click', function () {
      var ids = []; ov.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) { ids.push(cb.value); });
      if (!ids.length) { Utils.showToast('请至少选择一位教师', 'error'); return; }
      var btn = document.getElementById('pcb'); btn.disabled = true; btn.textContent = '推送中...';
      App.callFunction('push-template', { templateKey: tk, teacherIds: ids }).then(function (res) {
        var r = res.result || {}; document.getElementById('prs').textContent = '成功: ' + (r.success || 0) + ' / 失败: ' + ((r.failed || []).length);
        btn.disabled = false; btn.textContent = '确认推送'; Utils.showToast('推送完成');
      }).catch(function (e) { document.getElementById('prs').textContent = '推送失败'; btn.disabled = false; btn.textContent = '确认推送'; });
    });
  }
};
