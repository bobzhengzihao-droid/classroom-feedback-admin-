const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const ADMIN_COLLECTION = 'admins';
const DATA_COLLECTION = 'user_data';
const LOG_COLLECTION = 'admin_logs';

exports.main = async (event, context) => {
  const { templateKey, teacherIds } = event;
  const callerOpenid = cloud.getWXContext().OPENID;

  // 1. 校验管理员身份
  const adminCheck = await db.collection(ADMIN_COLLECTION)
    .where({ openid: callerOpenid })
    .get();
  if (!adminCheck.data || adminCheck.data.length === 0) {
    return { success: 0, failed: teacherIds, total: teacherIds.length, error: 'not_admin' };
  }

  // 2. 读取模板数据
  const templateDoc = await db.collection(DATA_COLLECTION)
    .where({ key: templateKey })
    .get();
  if (!templateDoc.data || templateDoc.data.length === 0) {
    return { success: 0, failed: teacherIds, total: teacherIds.length, error: 'template_not_found' };
  }

  const templateValue = templateDoc.data[0].value;

  // 3. 逐教师写入
  const failed = [];
  for (const teacherId of teacherIds) {
    if (!teacherId) { failed.push(teacherId); continue; }
    try {
      // 从 templateKey 提取 grade-subject 部分
      // 格式: openid|template|grade-subject
      const parts = templateKey.split('|');
      const gradeSubject = parts.slice(2).join('|');
      const targetKey = teacherId + '|template|' + gradeSubject;

      // 查询是否已存在
      const existing = await db.collection(DATA_COLLECTION)
        .where({ key: targetKey })
        .get();

      if (existing.data && existing.data.length > 0) {
        await db.collection(DATA_COLLECTION)
          .doc(existing.data[0]._id)
          .update({ data: { value: templateValue } });
      } else {
        await db.collection(DATA_COLLECTION)
          .add({ data: { key: targetKey, value: templateValue } });
      }
    } catch (e) {
      failed.push(teacherId);
    }
  }

  // 4. 写操作日志
  await db.collection(LOG_COLLECTION).add({
    data: {
      openid: callerOpenid,
      action: 'push_template',
      target: 'template=' + templateKey + ' teachers=' + teacherIds.length,
      result: 'success=' + (teacherIds.length - failed.length) + ' failed=' + failed.length,
      createdAt: Date.now()
    }
  });

  return {
    success: teacherIds.length - failed.length,
    failed: failed,
    total: teacherIds.length
  };
};
