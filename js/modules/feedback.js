var Module = {
  render: function (state) {
    var c = document.getElementById('content');
    c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    var db = { allData: {} };
    App.db('user_data', { keyPrefix: '.*\\|classes$' }, 500).then(function (r) {
      (r.data || []).forEach(function (d) { var p = d.key.split('|'), oi = p[0]; if (!db.allData[oi]) db.allData[oi] = []; if (Array.isArray(d.value)) { d.value.forEach(function (cls) { db.allData[oi].push({ id: cls.id, name: (cls.grade || '') + ' · ' + (cls.subject || '') }); }); } });
      Module.renderView(c, db);
    }).catch(function (e) { c.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(e.message || e)) + '</p></div>'; });
  },
  renderView: function (c, db) {
    var h = '<h1 class="section-title">反馈数据</h1>';
    h += '<div class="search-bar"><select id="ft"><option value="">选择教师</option></select><select id="fc"><option value="">选择班级</option></select><select id="fd"><option value="">选择课次</option></select></div>';
    h += '<button id="flb" class="btn-primary btn-small" disabled>查看反馈</button><div id="fg" style="margin-top:16px"></div>';
    c.innerHTML = h;
    App.db('teacher_profiles', {}, 500).then(function (r) {
      (r.data || []).forEach(function (t) { var o = document.createElement('option'); o.value = t._openid; o.textContent = t.nickname || t._openid; document.getElementById('ft').appendChild(o); });
    });
    document.getElementById('ft').addEventListener('change', function () {
      var oi = this.value, cls = document.getElementById('fc'), dt = document.getElementById('fd');
      cls.innerHTML = '<option value="">选择班级</option>'; dt.innerHTML = '<option value="">选择课次</option>';
      document.getElementById('flb').disabled = true; document.getElementById('fg').innerHTML = '';
      if (!oi) return;
      (db.allData[oi] || []).forEach(function (x) { var o = document.createElement('option'); o.value = x.id; o.textContent = x.name; cls.appendChild(o); });
    });
    document.getElementById('fc').addEventListener('change', function () {
      var cid = this.value, oi = document.getElementById('ft').value, dt = document.getElementById('fd');
      dt.innerHTML = '<option value="">加载课次...</option>'; document.getElementById('flb').disabled = true; document.getElementById('fg').innerHTML = '';
      if (!cid || !oi) return;
      App.db('user_data', { keyPrefix: '^' + oi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\|fb\\|' + cid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\|' }, 50).then(function (r) {
        dt.innerHTML = '<option value="">选择课次</option>'; (r.data || []).forEach(function (d) { var dl = d.key.substring((oi + '|fb|' + cid + '|').length); if (dl) { var o = document.createElement('option'); o.value = dl; o.textContent = dl; dt.appendChild(o); } });
      });
    });
    document.getElementById('fd').addEventListener('change', function () { document.getElementById('flb').disabled = !this.value; });
    document.getElementById('flb').addEventListener('click', function () {
      var oi = document.getElementById('ft').value, cid = document.getElementById('fc').value, dl = document.getElementById('fd').value;
      if (!oi || !cid || !dl) return;
      var key = oi + '|fb|' + cid + '|' + dl;
      App.db('user_data', { key: key }, 1).then(function (r) {
        if (r.data && r.data.length > 0) { Module.renderGrid(document.getElementById('fg'), r.data[0].value); }
        else { document.getElementById('fg').innerHTML = '<div class="empty-state"><p>该课次无反馈数据</p></div>'; }
      });
    });
  },
  renderGrid: function (ct, entry) {
    if (!entry) { ct.innerHTML = '<div class="empty-state"><p>无数据</p></div>'; return; }
    var cols = entry.columns || entry.dateColumns || [], recs = entry.records || [], cells = entry.cells || {};
    if (Object.keys(cells).length > 0 && (!recs || !recs.length)) {
      var mr = -1, mc = -1;
      Object.keys(cells).forEach(function (ck) { var parts = ck.split('-'), r = parseInt(parts[0],10), c = parseInt(parts[1],10); if (!isNaN(r) && r > mr) mr = r; if (!isNaN(c) && c > mc) mc = c; });
      for (var r = 0; r <= mr; r++) { var vs = [], cs = []; for (var co = 0; co <= mc; co++) { var cell = cells[r + '-' + co]; vs.push(cell ? (cell.v || '') : ''); cs.push(cell ? (cell.c || '') : ''); } recs.push({ name: '', values: vs, colors: cs }); }
      if (!cols.length) { for (var ci = 0; ci <= mc; ci++) cols.push({ name: '', maxScore: 0 }); }
    }
    var h = '<div class="feedback-table-wrapper"><table class="feedback-table"><thead><tr><th style="min-width:80px">学生</th>';
    cols.forEach(function (col) { h += '<th style="min-width:100px">' + Utils.escapeHtml(col.name || '-') + '</th>'; });
    h += '</tr></thead><tbody>';
    recs.forEach(function (rec, ri) { h += '<tr><td style="font-weight:500">' + Utils.escapeHtml(rec.name || ('行' + (ri + 1))) + '</td>'; (rec.values || []).forEach(function (v, ci) { var bg = (rec.colors && rec.colors[ci]) ? 'background:' + rec.colors[ci] + ';color:#fff;border-radius:4px;padding:2px 6px;display:inline-block' : ''; h += '<td><span style="' + bg + '">' + Utils.escapeHtml(v || '') + '</span></td>'; }); h += '</tr>'; });
    h += '</tbody></table></div>';
    ct.innerHTML = h;
  }
};
