// js/modules/templates.js
// 模板管理与推送 — 模板列表、推送给教师、推送结果反馈
var Module = {
  render: function (tcb, state) {
    var content = document.getElementById('content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">加载中...</p></div>';

    var db = tcb.database();

    // 加载三类数据：模板、教师、自定义预设
    Promise.all([
      db.collection('user_data').where({ key: db.RegExp({ regexp: '.*\\|template\\|.*' }) }).get(),
      db.collection('teacher_profiles').get(),
      db.collection('user_data').where({ key: db.RegExp({ regexp: '.*\\|custom_presets$' }) }).get()
    ]).then(function (results) {
      var templates = results[0].data || [];
      var teachers = results[1].data || [];
      var presets = results[2].data || [];
      Module.renderView(content, templates, teachers, presets);
    }).catch(function (err) {
      content.innerHTML = '<div class="empty-state"><p>加载失败: ' + Utils.escapeHtml(String(err.message || err)) + '</p></div>';
    });
  },

  /**
   * 渲染模板列表视图
   * @param {HTMLElement} content - 内容容器
   * @param {Array} templates - 模板数据
   * @param {Array} teachers - 教师数据
   * @param {Array} presets - 自定义预设数据（保留供后续使用）
   */
  renderView: function (content, templates, teachers, presets) {
    var html = '<h1 class="section-title">模板管理</h1>';

    // 构建 openid → teacher 的快速查找映射
    var teacherMap = {};
    teachers.forEach(function (t) {
      teacherMap[t._openid] = t;
    });

    // 模板列表卡片
    html += '<div class="card"><div class="card-header">预设模板</div>';
    if (!templates || templates.length === 0) {
      html += '<div class="empty-state"><p>暂无模板</p></div>';
    } else {
      html += '<table><thead><tr><th>年级-科目</th><th>教师</th><th>操作</th></tr></thead><tbody>';
      templates.forEach(function (doc) {
        // key 格式: openid|template|grade-subject
        var parts = doc.key.split('|');
        var gradeSubject = parts.slice(2).join('|');
        var ownerOpenid = parts[0];
        var teacher = teacherMap[ownerOpenid];
        var teacherName = teacher ? teacher.nickname : ownerOpenid;

        html += '<tr>';
        html += '<td>' + Utils.escapeHtml(gradeSubject) + '</td>';
        html += '<td>' + Utils.escapeHtml(teacherName) + '</td>';
        html += '<td><button class="btn-primary btn-small push-btn" data-key="' + Utils.escapeHtml(doc.key) + '" data-grade-subject="' + Utils.escapeHtml(gradeSubject) + '">推送给教师</button></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    // 自定义预设卡片
    if (presets && presets.length > 0) {
      html += '<div class="card"><div class="card-header">自定义预设</div>';
      html += '<table><thead><tr><th>所属教师</th><th>预设内容</th></tr></thead><tbody>';
      presets.forEach(function (doc) {
        var ownerOpenid = doc.key.split('|')[0];
        var teacher = teacherMap[ownerOpenid];
        var teacherName = teacher ? teacher.nickname : ownerOpenid;
        var presetSummary = '';
        if (doc.value && Array.isArray(doc.value)) {
          presetSummary = doc.value.length + ' 个预设项';
        } else if (doc.value && typeof doc.value === 'object') {
          presetSummary = Object.keys(doc.value).length + ' 个预设项';
        } else {
          presetSummary = '-';
        }
        html += '<tr>';
        html += '<td>' + Utils.escapeHtml(teacherName) + '</td>';
        html += '<td>' + Utils.escapeHtml(presetSummary) + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '</div>';
    }

    content.innerHTML = html;

    // 推送按钮事件绑定
    content.querySelectorAll('.push-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var templateKey = btn.getAttribute('data-key');
        var gradeSubject = btn.getAttribute('data-grade-subject');
        Module.showPushModal(templateKey, gradeSubject, teachers);
      });
    });
  },

  /**
   * 显示推送模态框
   * @param {string} templateKey - 模板的完整 key
   * @param {string} gradeSubject - 年级-科目标识
   * @param {Array} teachers - 教师列表
   */
  showPushModal: function (templateKey, gradeSubject, teachers) {
    // 移除已存在的同类模态框
    var existing = document.querySelector('.push-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay push-modal-overlay';

    var html = '<div class="modal">';
    html += '<div class="modal-header"><span>推送模板: ' + Utils.escapeHtml(gradeSubject) + '</span><button class="modal-close">&times;</button></div>';
    html += '<p style="font-size:13px;color:#64748b;margin-bottom:12px">选择目标教师</p>';

    // 搜索过滤
    html += '<div class="search-bar"><input id="push-teacher-search" type="text" placeholder="搜索教师..."></div>';

    // 教师复选框列表
    html += '<div class="checkbox-list" id="teacher-checkbox-list">';
    if (!teachers || teachers.length === 0) {
      html += '<p style="color:#94a3b8;text-align:center;padding:16px">暂无教师数据</p>';
    } else {
      teachers.forEach(function (t) {
        var teacherId = Utils.escapeHtml(t._openid || '');
        var teacherLabel = Utils.escapeHtml(t.nickname || t._openid || '');
        var grade = Utils.escapeHtml(t.default_grade || '-');
        var subject = Utils.escapeHtml(t.default_subject || '-');
        html += '<label class="checkbox-item"><input type="checkbox" value="' + teacherId + '"> ' + teacherLabel + ' (' + grade + ' · ' + subject + ')</label>';
      });
    }
    html += '</div>';

    // 操作区域：确认按钮 + 结果反馈
    html += '<div style="margin-top:16px;display:flex;gap:8px;align-items:center">';
    html += '<button id="push-confirm-btn" class="btn-primary">确认推送</button>';
    html += '<span id="push-result" style="font-size:13px"></span>';
    html += '</div>';

    html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // 关闭事件
    var closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { overlay.remove(); });
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    // 搜索教师过滤
    var searchInput = document.getElementById('push-teacher-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(function () {
        var q = (searchInput.value || '').toLowerCase();
        var labels = overlay.querySelectorAll('.checkbox-item');
        labels.forEach(function (label) {
          var text = label.textContent.toLowerCase();
          label.style.display = text.indexOf(q) >= 0 ? 'flex' : 'none';
        });
      }, 200));
    }

    // 确认推送
    var pushBtn = document.getElementById('push-confirm-btn');
    var resultEl = document.getElementById('push-result');
    if (pushBtn) {
      pushBtn.addEventListener('click', function () {
        var checked = overlay.querySelectorAll('input[type="checkbox"]:checked');
        var teacherIds = [];
        checked.forEach(function (cb) { teacherIds.push(cb.value); });

        if (teacherIds.length === 0) {
          Utils.showToast('请至少选择一位教师', 'error');
          return;
        }

        pushBtn.disabled = true;
        pushBtn.textContent = '推送中...';

        // 调用云函数
        App.cloudbase.callFunction({
          name: 'push-template',
          data: { templateKey: templateKey, teacherIds: teacherIds }
        }).then(function (res) {
          var result = res.result || {};
          var successCount = result.success || 0;
          var failedList = result.failed || [];
          var failedCount = Array.isArray(failedList) ? failedList.length : 0;
          if (resultEl) {
            resultEl.textContent = '成功: ' + successCount + ' / 失败: ' + failedCount;
            resultEl.className = successCount > 0 ? 'text-success' : 'text-danger';
          }
          pushBtn.disabled = false;
          pushBtn.textContent = '确认推送';
          Utils.showToast('推送完成');
        }).catch(function (err) {
          if (resultEl) {
            resultEl.textContent = '推送失败: ' + (err.message || '未知错误');
            resultEl.className = 'text-danger';
          }
          pushBtn.disabled = false;
          pushBtn.textContent = '确认推送';
          Utils.showToast('推送失败', 'error');
        });
      });
    }
  }
};
