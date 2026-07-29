const app = getApp();

const request = (options) => {
  return new Promise((resolve, reject) => {
    const userId = app.globalData.userId;
    wx.request({
      url: app.globalData.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'X-User-Id': userId || ''
      },
      success(res) {
        if (res.data && res.data.code === 0) {
          resolve(res.data);
        } else {
          const msg = (res.data && res.data.msg) || '请求失败';
          wx.showToast({ title: msg, icon: 'none' });
          reject(msg);
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      }
    });
  });
};

module.exports = { request };
