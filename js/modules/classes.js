var Module = {
  render: function (state) {
    var c = document.getElementById('content');
    c.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    Promise.all([App.db('user_data', { keyPrefix: '.*\\|classes$' }, 500), App.db('teacher_profiles', {}, 500)])
      .then(function (r) {
        var u = r[0].data || [], p = r[1].data || [];
        Module.renderView(c, u, p);
      }).catch(function (e) {
        c.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(e.message || e)) + '</p></div>';
      });
  },
  renderView: function (c, u, p) {
    var all = [];
    u.forEach(function (d) {
      var oi = d.key.split('|')[0];
      var t = p.find(function (x) { return x._openid === oi; }) || {};
      if (Array.isArray(d.value)) { d.value.forEach(function (cls) { all.push({ tn: t.nickname || oi, oi: oi, cls: cls }); }); }
    });
    var h = '<h1 class="section-title">班级浏览</h1>';
    h += '<div class="search-bar"><input id="cs" type="text" placeholder="搜索班级名、教师名..."><select id="cg"><option value="">全部年级</option></select><select id="csb"><option value="">全部科目</option></select></div><div id="clc"></div>';
    c.innerHTML = h;
    var gs = {}, ss = {};
    all.forEach(function (x) { if (x.cls.grade) gs[x.cls.grade] = 1; if (x.cls.subject) ss[x.cls.subject] = 1; });
    Object.keys(gs).sort().forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; document.getElementById('cg').appendChild(o); });
    Object.keys(ss).sort().forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; document.getElementById('csb').appendChild(o); });
    var filter = function () { Module.renderList(all); };
    document.getElementById('cs').addEventListener('input', Utils.debounce(filter, 200));
    document.getElementById('cg').addEventListener('change', filter);
    document.getElementById('csb').addEventListener('change', filter);
    Module.renderList(all);
  },
  renderList: function (all) {
    var ct = document.getElementById('clc');
    var s = (document.getElementById('cs') || {}).value || '', gf = (document.getElementById('cg') || {}).value || '', sf = (document.getElementById('csb') || {}).value || '';
    var f = all.filter(function (x) {
      if (s) { var q = s.toLowerCase(); if (x.tn.toLowerCase().indexOf(q) === -1 && (x.cls.name || '').toLowerCase().indexOf(q) === -1) return false; }
      if (gf && x.cls.grade !== gf) return false;
      if (sf && x.cls.subject !== sf) return false;
      return true;
    });
    if (!f.length) { ct.innerHTML = '<div class="empty-state"><p>暂无班级数据</p></div>'; return; }
    var grps = {};
    f.forEach(function (x) { if (!grps[x.oi]) grps[x.oi] = { tn: x.tn, items: [] }; grps[x.oi].items.push(x); });
    var h = '';
    Object.keys(grps).forEach(function (oi) {
      var g = grps[oi];
      h += '<div class="card"><div class="card-header">' + Utils.escapeHtml(g.tn) + ' <span class="badge badge-blue">' + g.items.length + ' 个班级</span></div>';
      h += '<table><thead><tr><th>年级</th><th>科目</th><th>学生数</th><th>反馈维度</th></tr></thead><tbody>';
      g.items.forEach(function (x) {
        var cc = x.cls;
        var sc = (cc.students && cc.students.length) || 0;
        var cn = (cc.columns || []).map(function (col) { return col.name || ''; }).filter(Boolean).join('、') || '-';
        h += '<tr class="clickable-row" data-js=\'' + JSON.stringify({ oi: oi, cid: cc.id, st: cc.students || [] }) + '\'><td>' + Utils.escapeHtml(cc.grade || '-') + '</td><td>' + Utils.escapeHtml(cc.subject || '-') + '</td><td>' + sc + '</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + Utils.escapeHtml(cn) + '</td></tr>';
      });
      h += '</tbody></table></div>';
    });
    ct.innerHTML = h;
    ct.querySelectorAll('.clickable-row').forEach(function (r) {
      r.addEventListener('click', function () {
        var d = JSON.parse(r.getAttribute('data-js'));
        var ov = document.createElement('div');
        ov.className = 'modal-overlay';
        var sh = '<div class="modal"><div class="modal-header"><span>学生列表</span><button class="modal-close">&times;</button></div>';
        if (!d.st.length) { sh += '<div class="empty-state"><p>暂无学生</p></div>'; }
        else { sh += '<table><tbody>'; d.st.forEach(function (n, i) { sh += '<tr><td style="color:#94a3b8;width:40px">' + (i + 1) + '</td><td>' + Utils.escapeHtml(n || '-') + '</td></tr>'; }); sh += '</tbody></table>'; }
        sh += '</div>';
        ov.innerHTML = sh;
        ov.querySelector('.modal-close').addEventListener('click', function () { ov.remove(); });
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
        document.body.appendChild(ov);
      });
    });
  }
};
