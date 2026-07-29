App({
  globalData: {
    userId: null,
    baseUrl: 'https://huitogo.club'
  },

  onLaunch() {
    this.login();
  },

  login() {
    const that = this;
    wx.login({
      success(res) {
        if (res.code) {
          wx.request({
            url: that.globalData.baseUrl + '/api/user/login',
            method: 'POST',
            data: { code: res.code },
            success(resp) {
              if (resp.data && resp.data.code === 0) {
                that.globalData.userId = resp.data.data.id;
                if (that.userReadyCallback) {
                  that.userReadyCallback(resp.data.data);
                }
              }
            }
          });
        }
      }
    });
  }
});
