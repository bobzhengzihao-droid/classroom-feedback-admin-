// js/modules/export.js
// 数据导出 — 按范围/格式导出 user_data 集合数据，支持 CSV/JSON 下载
var Module = {
  render: function (tcb, state) {
    Utils.showLoading();
    var db = tcb.database();

    db.collection('teacher_profiles').get().then(function (res) {
      var teachers = res.data || [];
      Module.renderView(db, teachers);
    }).catch(function (err) {
      var content = document.getElementById('content');
      content.innerHTML = '<div class="empty-state"><p>加载教师列表失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
    });
  },

  renderView: function (db, teachers) {
    var content = document.getElementById('content');

    var html = '<h1 class="section-title">数据导出</h1>';

    html += '<div class="card">';
    html += '<div class="card-header">导出选项</div>';

    // 范围选择
    html += '<div class="form-group">';
    html += '<label>导出范围</label>';
    html += '<select id="export-scope">';
    html += '<option value="all">全平台</option>';
    if (teachers.length > 0) {
      html += '<optgroup label="按教师">';
      teachers.forEach(function (t) {
        html += '<option value="' + Utils.escapeHtml(t._openid || '') + '">' + Utils.escapeHtml(t.nickname || t._openid || '未知教师') + '</option>';
      });
      html += '</optgroup>';
    }
    html += '</select>';
    html += '</div>';

    // 格式选择
    html += '<div class="form-group">';
    html += '<label>导出格式</label>';
    html += '<select id="export-format">';
    html += '<option value="csv">CSV (Excel 可打开)</option>';
    html += '<option value="json">JSON</option>';
    html += '</select>';
    html += '</div>';

    // 操作按钮区
    html += '<div class="flex gap-12" style="align-items:center">';
    html += '<button id="export-start-btn" class="btn-primary">开始导出</button>';
    html += '<span id="export-status" class="text-muted" style="font-size:13px"></span>';
    html += '</div>';

    html += '</div>';

    content.innerHTML = html;

    document.getElementById('export-start-btn').addEventListener('click', function () {
      var scope = document.getElementById('export-scope').value;
      var format = document.getElementById('export-format').value;
      Module.doExport(db, scope, format);
    });
  },

  doExport: function (db, scope, format) {
    var statusEl = document.getElementById('export-status');
    var btn = document.getElementById('export-start-btn');
    if (!statusEl || !btn) return;

    statusEl.textContent = '正在收集数据...';
    btn.disabled = true;

    // 构建查询条件：全平台不过滤，按教师则用 openid 前缀匹配 key 字段
    var condition = {};
    if (scope !== 'all') {
      condition.key = db.RegExp({
        regexp: '^' + scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\|'
      });
    }

    db.collection('user_data').where(condition).get().then(function (res) {
      var data = res.data || [];

      var output;
      if (format === 'csv') {
        output = Module.toCSV(data);
      } else {
        output = JSON.stringify(data, null, 2);
      }

      // 触发浏览器下载
      var ext = format === 'csv' ? 'csv' : 'json';
      var mime = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';
      var blob = new Blob(['﻿' + output], { type: mime }); // BOM for Excel 正确识别中文
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'feedback-export-' + scope + '-' + new Date().toISOString().slice(0, 10) + '.' + ext;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      statusEl.textContent = '导出完成，共 ' + data.length + ' 条记录';
      btn.disabled = false;
      Utils.showToast('导出完成');
    }).catch(function (err) {
      statusEl.textContent = '导出失败';
      btn.disabled = false;
      Utils.showToast('导出失败: ' + (err.message || '未知错误'), 'error');
    });
  },

  toCSV: function (data) {
    if (!data.length) return '';

    // 展平数据：将 user_data 文档的嵌套 value 对象展开为平铺列
    var rows = [];
    data.forEach(function (doc) {
      var value = doc.value;
      if (typeof value === 'object' && !Array.isArray(value)) {
        var flat = { _key: doc.key, _id: doc._id };
        Object.keys(value).forEach(function (k) {
          flat[k] = typeof value[k] === 'object' ? JSON.stringify(value[k]) : value[k];
        });
        rows.push(flat);
      } else {
        rows.push({ _key: doc.key, _id: doc._id, value: JSON.stringify(value) });
      }
    });

    // 收集所有列名（union of keys across all rows）
    var cols = {};
    rows.forEach(function (r) { Object.keys(r).forEach(function (k) { cols[k] = true; }); });
    var headers = Object.keys(cols);

    // 生成 CSV：双引号包裹每个单元格，内部引号转义为两个引号
    var csv = headers.map(function (h) { return '"' + h.replace(/"/g, '""') + '"'; }).join(',') + '\n';
    rows.forEach(function (row) {
      var line = headers.map(function (h) {
        var v = row[h] !== undefined ? String(row[h]) : '';
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(',');
      csv += line + '\n';
    });

    return csv;
  }
};
