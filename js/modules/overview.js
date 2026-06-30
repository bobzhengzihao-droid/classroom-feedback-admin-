var Module = {
  render: function (state) { Utils.showLoading(); this.loadData(state); },
  loadData: function () {
    var content = document.getElementById('content');
    Promise.all([App.db('teacher_profiles',{},500), App.db('user_data',{keyPrefix:'.*\\|classes$'},500), App.db('admin_logs',{},10)])
    .then(function(r){ var p=r[0].data||[], c=r[1].data||[], l=r[2].data||[], cc=0;
      c.forEach(function(d){ if(Array.isArray(d.value)) cc+=d.value.length; });
      App.count('user_data',{keyPrefix:'.*\\|fb\\|.*'}).then(function(f){ Module.renderDash(content,p.length,cc,f.total||0,p,l); }).catch(function(){ Module.renderDash(content,p.length,cc,0,p,l); });
    }).catch(function(e){ content.innerHTML='<div class="empty-state"><p>加载失败: '+Utils.escapeHtml(String(e.message||e))+'</p></div>'; });
  },
  renderDash: function(c, tc, cc, fc, p, l) {
    var r=p.filter(function(t){return t._updateTime||t.createTime}).sort(function(a,b){return (b._updateTime||b.createTime||0)-(a._updateTime||a.createTime||0)}).slice(0,10);
    var h='<h1 class="section-title">概览</h1>';
    h+='<div class="stat-grid">';
    h+='<div class="stat-card"><div class="stat-value">'+tc+'</div><div class="stat-label">教师总数</div></div>';
    h+='<div class="stat-card"><div class="stat-value">'+cc+'</div><div class="stat-label">班级总数</div></div>';
    h+='<div class="stat-card"><div class="stat-value">'+fc+'</div><div class="stat-label">反馈条目</div></div>';
    h+='<div class="stat-card"><div class="stat-value">'+l.length+'</div><div class="stat-label">近期操作</div></div></div>';
    h+='<div class="card"><div class="card-header">最近活跃教师</div>';
    if(!r.length){h+='<div class="empty-state"><p>暂无数据</p></div>';}else{h+='<table><thead><tr><th>昵称</th><th>默认年级</th><th>默认科目</th></tr></thead><tbody>';
    r.forEach(function(t){h+='<tr><td>'+Utils.escapeHtml(t.nickname||'-')+'</td><td>'+Utils.escapeHtml(t.default_grade||'-')+'</td><td>'+Utils.escapeHtml(t.default_subject||'-')+'</td></tr>';});
    h+='</tbody></table>';}h+='</div>';
    h+='<div class="card"><div class="card-header">最近操作日志</div>';
    if(!l.length){h+='<div class="empty-state"><p>暂无操作记录</p></div>';}else{h+='<table><thead><tr><th>时间</th><th>操作</th><th>对象</th></tr></thead><tbody>';
    l.forEach(function(x){h+='<tr><td>'+Utils.formatDateTime(x.createdAt)+'</td><td><span class="badge badge-blue">'+Utils.escapeHtml(x.action||'-')+'</span></td><td>'+Utils.escapeHtml(x.target||'-')+'</td></tr>';});
    h+='</tbody></table>';}h+='</div>';
    c.innerHTML=h;
  }
};
