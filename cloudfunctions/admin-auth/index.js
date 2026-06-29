// 管理后台密码验证云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const { password } = event;
  if (!password) return { ok: false };

  try {
    const res = await db.collection('admins')
      .where({ password: password })
      .get();
    return { ok: res.data && res.data.length > 0 };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
