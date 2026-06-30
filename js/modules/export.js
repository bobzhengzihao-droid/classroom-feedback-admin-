var Module = {
  render: function (state) {
    var c = document.getElementById('content');
    c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    App.db('teacher_profiles', {}, 500).then(function (r) { Module.renderView(c, r.data || []); });
  },
  renderView: function (c, p) {
    var h = '<h1 class="section-title">数据导出</h1><div class="card"><div class="card-header">导出选项</div>';
    h += '<div style="margin-bottom:16px"><label style="font-size:13px;color:#64748b;display:block;margin-bottom:8px">导出范围</label><select id="es"><option value="all">全平台</option><optgroup label="按教师">';
    p.forEach(function (t) { h += '<option value="' + Utils.escapeHtml(t._openid || '') + '">' + Utils.escapeHtml(t.nickname || t._openid) + '</option>'; });
    h += '</optgroup></select></div>';
    h += '<div style="margin-bottom:16px"><label style="font-size:13px;color:#64748b;display:block;margin-bottom:8px">导出格式</label><select id="ef"><option value="csv">CSV</option><option value="json">JSON</option></select></div>';
    h += '<button id="ebtn" class="btn-primary">开始导出</button><span id="est" style="margin-left:12px;font-size:13px;color:#64748b"></span></div>';
    c.innerHTML = h;
    document.getElementById('ebtn').addEventListener('click', function () {
      var scope = document.getElementById('es').value, fmt = document.getElementById('ef').value, st = document.getElementById('est'), btn = document.getElementById('ebtn');
      st.textContent = '正在收集数据...'; btn.disabled = true;
      var q = scope === 'all' ? {} : { keyPrefix: '^' + scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\|' };
      App.db('user_data', q, 2000).then(function (r) {
        var data = r.data || [], output;
        if (fmt === 'csv') { output = Module.toCSV(data); }
        else { output = JSON.stringify(data, null, 2); }
        var ext = fmt === 'csv' ? 'csv' : 'json', mime = fmt === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';
        var blob = new Blob(['﻿' + output], { type: mime }), url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = 'feedback-export-' + scope + '-' + new Date().toISOString().slice(0, 10) + '.' + ext;
        a.click(); URL.revokeObjectURL(url);
        st.textContent = '导出完成，共 ' + data.length + ' 条'; btn.disabled = false;
      }).catch(function (e) { st.textContent = '导出失败'; btn.disabled = false; });
    });
  },
  toCSV: function (data) {
    if (!data.length) return '';
    var rows = []; data.forEach(function (d) { var flat = { _key: d.key, _id: d._id }; var v = d.value; if (typeof v === 'object' && !Array.isArray(v)) { Object.keys(v).forEach(function (k) { flat[k] = typeof v[k] === 'object' ? JSON.stringify(v[k]) : v[k]; }); } else { flat.value = JSON.stringify(v); } rows.push(flat); });
    var cols = {}; rows.forEach(function (r) { Object.keys(r).forEach(function (k) { cols[k] = true; }); });
    var headers = Object.keys(cols);
    var csv = headers.map(function (h) { return '"' + h.replace(/"/g, '""') + '"'; }).join(',') + '\n';
    rows.forEach(function (r) { csv += headers.map(function (h) { var v = r[h] !== undefined ? String(r[h]) : ''; return '"' + v.replace(/"/g, '""') + '"'; }).join(',') + '\n'; });
    return csv;
  }
};
