const { request } = require('../../utils/request.js');
const app = getApp();

Page({
  data: {
    activeTab: 0,
    tabs: ['最近7天', '本月', '全部'],
    typeMap: ['week', 'month', 'all'],
    records: [],
    groupedRecords: [],
    page: 1,
    size: 30,
    hasMore: true,
    totalCount: 0
  },

  onShow() {
    if (app.globalData.userId) {
      this.resetAndLoad();
    } else {
      app.userReadyCallback = () => {
        this.resetAndLoad();
      };
    }
  },

  resetAndLoad() {
    this.setData({ records: [], groupedRecords: [], page: 1, hasMore: true, totalCount: 0 });
    this.loadRecords();
  },

  onTabChange(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ activeTab: idx });
    this.resetAndLoad();
  },

  loadRecords() {
    const { typeMap, activeTab, page, size } = this.data;
    request({
      url: `/api/record/list?type=${typeMap[activeTab]}&page=${page}&size=${size}`
    }).then(res => {
      const pageData = res.data;
      const newRecords = pageData.records || [];
      const allRecords = this.data.records.concat(newRecords);
      this.setData({
        records: allRecords,
        totalCount: pageData.total || allRecords.length,
        hasMore: newRecords.length >= size
      });
      this.groupByDate(allRecords);
    });
  },

  groupByDate(records) {
    const map = {};
    const today = this.formatDate(new Date());
    const yesterday = this.formatDate(new Date(Date.now() - 86400000));

    records.forEach(r => {
      const dateStr = (r.checkinTime || '').substring(0, 10);
      let label = dateStr;
      if (dateStr === today) label = '今天';
      else if (dateStr === yesterday) label = '昨天';

      if (!map[dateStr]) {
        map[dateStr] = { label, date: dateStr, items: [] };
      }
      map[dateStr].items.push({
        ...r,
        timeStr: (r.checkinTime || '').substring(11, 16)
      });
    });

    const grouped = Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map(k => map[k]);

    this.setData({ groupedRecords: grouped });
  },

  formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadRecords();
    }
  }
});
