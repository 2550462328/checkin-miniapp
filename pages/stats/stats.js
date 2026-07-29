const { request } = require('../../utils/request.js');
const app = getApp();

const COLORS = ['#667eea', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#ffd86f', '#a18cd1', '#30cfd0'];

Page({
  data: {
    activeTab: 0,
    tabs: ['本周', '本月'],
    typeMap: ['week', 'month'],
    statsData: [],
    totalCount: 0,
    colors: COLORS
  },

  onShow() {
    if (app.globalData.userId) {
      this.loadStats();
    } else {
      app.userReadyCallback = () => {
        this.loadStats();
      };
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.idx });
    this.loadStats();
  },

  loadStats() {
    const { typeMap, activeTab } = this.data;
    request({
      url: `/api/stats/summary?type=${typeMap[activeTab]}`
    }).then(res => {
      const data = res.data || [];
      const totalCount = data.reduce((s, d) => s + d.count, 0);
      this.setData({ statsData: data, totalCount });
      this.drawBarChart(data);
      this.drawPieChart(data);
    });
  },

  drawBarChart(data) {
    if (data.length === 0) return;

    const query = wx.createSelectorQuery();
    query.select('#barCanvas')
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        const w = res[0].width;
        const h = res[0].height;
        const pt = 30, pr = 20, pb = 44, pl = 10;
        const chartW = w - pl - pr;
        const chartH = h - pt - pb;

        ctx.clearRect(0, 0, w, h);

        const maxCount = Math.max(...data.map(d => d.count), 1);
        const barWidth = Math.min(chartW / data.length * 0.55, 36);
        const gap = chartW / data.length;

        // 背景横线
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
          const y = pt + chartH * (1 - i / 4);
          ctx.beginPath();
          ctx.moveTo(pl, y);
          ctx.lineTo(pl + chartW, y);
          ctx.stroke();
        }

        data.forEach((item, i) => {
          const barH = Math.max((item.count / maxCount) * chartH, 4);
          const x = pl + i * gap + (gap - barWidth) / 2;
          const y = pt + chartH - barH;

          // 圆角柱子
          const r = barWidth / 2;
          const color = COLORS[i % COLORS.length];

          ctx.beginPath();
          ctx.moveTo(x, y + barH);
          ctx.lineTo(x, y + r);
          ctx.arc(x + r, y + r, r, Math.PI, 0, false);
          ctx.lineTo(x + barWidth, y + barH);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();

          // 数值
          ctx.fillStyle = color;
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.count, x + barWidth / 2, y - 8);

          // 标签
          ctx.fillStyle = '#999';
          ctx.font = '10px sans-serif';
          const label = item.itemName.length > 4 ? item.itemName.substring(0, 4) + '..' : item.itemName;
          ctx.fillText(label, x + barWidth / 2, h - pb + 18);
        });
      });
  },

  drawPieChart(data) {
    if (data.length === 0) return;

    const query = wx.createSelectorQuery();
    query.select('#pieCanvas')
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        const w = res[0].width;
        const h = res[0].height;
        const centerX = w / 2;
        const centerY = h / 2;
        const outerR = Math.min(w, h) * 0.38;
        const innerR = outerR * 0.55;

        ctx.clearRect(0, 0, w, h);

        const total = data.reduce((sum, d) => sum + d.count, 0);
        let startAngle = -Math.PI / 2;

        // 环形
        data.forEach((item, i) => {
          const sliceAngle = (item.count / total) * 2 * Math.PI;
          ctx.beginPath();
          ctx.arc(centerX, centerY, outerR, startAngle, startAngle + sliceAngle);
          ctx.arc(centerX, centerY, innerR, startAngle + sliceAngle, startAngle, true);
          ctx.closePath();
          ctx.fillStyle = COLORS[i % COLORS.length];
          ctx.fill();
          startAngle += sliceAngle;
        });

        // 中心文字
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, centerX, centerY - 6);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.fillText('总次数', centerX, centerY + 14);
      });
  }
});
