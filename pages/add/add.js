const { request } = require('../../utils/request.js');

Page({
  data: {
    editId: null,
    name: '',
    formReady: false,
    frequency: 'DAILY',
    frequencies: ['DAILY', 'WEEKLY', 'ONCE'],
    frequencyLabels: ['每日一次', '每周一次', '固定日期'],
    frequencyDesc: ['每天都需要打卡', '在选定的星期几打卡', '仅在指定日期打卡一次'],
    weekDay: 1,
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    targetDate: '',
    remark: '',
    bubbleColor: '#667eea',
    colors: [
      { value: '#667eea', name: '极光紫' },
      { value: '#f5576c', name: '珊瑚红' },
      { value: '#4facfe', name: '晴空蓝' },
      { value: '#43e97b', name: '薄荷绿' },
      { value: '#fa709a', name: '蜜桃粉' },
      { value: '#ffd86f', name: '暖阳黄' },
      { value: '#a18cd1', name: '薰衣紫' },
      { value: '#30cfd0', name: '蒂芙蓝' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑习惯' });
      this.loadDetail(options.id);
    }
  },

  loadDetail(id) {
    request({ url: '/api/item/detail/' + id }).then(res => {
      var item = res.data;
      this.setData({
        name: item.name || '',
        frequency: item.frequency || 'DAILY',
        weekDay: item.weekDay || 1,
        targetDate: item.targetDate || '',
        remark: item.remark || '',
        bubbleColor: item.bubbleColor || '#667eea'
      });
    });
  },

  onReady() {
    setTimeout(() => {
      this.setData({ formReady: true });
    }, 50);
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onFrequencyTap(e) {
    const freq = e.currentTarget.dataset.freq;
    this.setData({ frequency: freq });
  },

  onWeekDayTap(e) {
    this.setData({ weekDay: e.currentTarget.dataset.day });
  },

  onDateChange(e) {
    this.setData({ targetDate: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onColorTap(e) {
    this.setData({ bubbleColor: e.currentTarget.dataset.color });
  },

  onSubmit() {
    const { editId, name, frequency, weekDay, targetDate, remark, bubbleColor } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: '给习惯起个名字吧', icon: 'none' });
      return;
    }
    if (frequency === 'ONCE' && !targetDate) {
      wx.showToast({ title: '请选择目标日期', icon: 'none' });
      return;
    }

    var data = {
      name: name.trim(),
      frequency,
      weekDay: frequency === 'WEEKLY' ? weekDay : null,
      targetDate: frequency === 'ONCE' ? targetDate : null,
      remark,
      bubbleColor
    };

    if (editId) {
      data.id = editId;
      request({
        url: '/api/item/update',
        method: 'POST',
        data: data
      }).then(function() {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(function() { wx.navigateBack(); }, 800);
      });
    } else {
      request({
        url: '/api/item/add',
        method: 'POST',
        data: data
      }).then(function() {
        wx.showToast({ title: '添加成功', icon: 'success' });
        setTimeout(function() { wx.navigateBack(); }, 800);
      });
    }
  },

  onDelete() {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      confirmColor: '#f5576c',
      success: function(res) {
        if (res.confirm) {
          request({
            url: '/api/item/remove/' + that.data.editId,
            method: 'POST'
          }).then(function() {
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(function() { wx.navigateBack(); }, 800);
          });
        }
      }
    });
  }
});
