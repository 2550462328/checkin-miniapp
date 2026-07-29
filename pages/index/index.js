const { request } = require('../../utils/request.js');
const app = getApp();

const QUOTES = [
  '日拱一卒，功不唐捐',
  '每一步都算数',
  '坚持本身就是天赋',
  '今天也要元气满满',
  '自律即自由',
  '微小的进步也是进步',
  '把坚持变成习惯',
  '你比想象中更强大',
  '不积跬步无以至千里',
  '保持热爱，奔赴山海',
  '行动是焦虑的解药',
  '每天进步一点点',
  '星光不负赶路人',
  '慢慢来，比较快',
  '种一棵树最好的时间是现在',
  '你的坚持终将美好',
  '今日事今日毕',
  '所有的努力都不会白费',
  '做时间的朋友',
  '越努力越幸运',
  '心之所向，素履以往',
  '念念不忘，必有回响'
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function getEncouragementText(percent) {
  if (percent === 0) return '从第一个开始，你可以的';
  if (percent < 50) return '已经开始了，继续保持';
  if (percent < 100) return '快完成了，冲刺一下';
  return '完美！今天的你很棒';
}

function getTodayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

Page({
  data: {
    items: [],
    bubbles: [],
    showModal: false,
    currentItem: null,
    remarkInput: '',
    screenWidth: 375,
    screenHeight: 600,
    todayStr: '',
    checkedCount: 0,
    totalCount: 0,
    // UI enhancements
    greeting: '',
    progressPercent: 0,
    encouragement: '',
    particles: [],
    // Quote popup
    showQuote: false,
    quoteText: '',
    quoteAnimOut: false,
    // Draggable robot
    robotX: 24,
    robotY: 600,
    robotMoved: false,
    showRobot: false,
    // Subscribe guide
    showSubscribeGuide: false
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo();
    const today = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const todayStr = `${today.getMonth() + 1}月${today.getDate()}日 周${weekdays[today.getDay()]}`;
    const greeting = getGreeting();

    // Generate 6 floating particles
    const particles = [];
    for (let i = 0; i < 6; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 10,
        delay: (Math.random() * 5).toFixed(1),
        duration: (6 + Math.random() * 6).toFixed(1),
        opacity: (0.2 + Math.random() * 0.4).toFixed(2)
      });
    }

    // Robot initial position: bottom-left above tabBar
    const robotY = sysInfo.windowHeight - 180;

    this.setData({
      screenWidth: sysInfo.windowWidth,
      screenHeight: sysInfo.windowHeight - 120,
      todayStr,
      greeting,
      particles,
      robotX: 24,
      robotY
    });
  },

  onShow() {
    const uid = app.globalData.userId;
    if (uid) {
      this.loadFeatures();
      this.loadItems();
    } else {
      app.userReadyCallback = () => {
        this.loadFeatures();
        this.loadItems();
      };
    }
    this.checkAndShowQuote();
  },

  loadFeatures() {
    request({ url: '/api/user/features' }).then(res => {
      var data = res.data || {};
      this.setData({ showRobot: !!data.showRobot });
    });
  },

  // --- Daily quote popup ---
  checkAndShowQuote() {
    const today = getTodayDateStr();
    const lastDate = wx.getStorageSync('lastQuoteDate');
    if (lastDate === today) return;

    const quoteText = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    wx.setStorageSync('lastQuoteDate', today);
    this.setData({ showQuote: true, quoteText, quoteAnimOut: false });

    this._quoteTimer = setTimeout(() => {
      this.closeQuote();
    }, 3000);
  },

  closeQuote() {
    if (this._quoteTimer) {
      clearTimeout(this._quoteTimer);
      this._quoteTimer = null;
    }
    this.setData({ quoteAnimOut: true });
    setTimeout(() => {
      this.setData({ showQuote: false, quoteAnimOut: false });
    }, 300);
  },

  onQuoteTap() {
    this.closeQuote();
  },

  // --- Data loading ---
  loadItems() {
    request({ url: '/api/item/today' }).then(res => {
      const items = res.data || [];
      const unchecked = items.filter(i => !i.checkedToday);
      const checkedCount = items.filter(i => i.checkedToday).length;
      const totalCount = items.length;
      const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
      const encouragement = getEncouragementText(progressPercent);

      this.setData({
        items,
        totalCount,
        checkedCount,
        progressPercent,
        encouragement
      });
      this.generateBubbles(unchecked);
      this.checkAndRequestSubscribe();
    });
  },

  // --- 订阅额度不足时请求授权 ---
  checkAndRequestSubscribe() {
    request({ url: '/api/user/subscribe-count' }).then(res => {
      if (res.data < 1) {
        this.setData({ showSubscribeGuide: true });
      }
    });
  },

  onConfirmSubscribe() {
    this.setData({ showSubscribeGuide: false });

    wx.requestSubscribeMessage({
      tmplIds: ['wyLt5Sbynt3y7nx0raeuUpTf9KLqB8HYmPDEiyoFWjQ'],
      success: function(res) {
        if (res['wyLt5Sbynt3y7nx0raeuUpTf9KLqB8HYmPDEiyoFWjQ'] === 'accept') {
          request({ url: '/api/user/subscribe', method: 'POST' });
        }
      }
    });
  },

  onCancelSubscribe() {
    this.setData({ showSubscribeGuide: false });
  },

  generateBubbles(items) {
    const { screenWidth, screenHeight } = this.data;
    const padding = 15;
    const availableHeight = screenHeight;
    const floatClasses = ['oceanFloat0', 'oceanFloat1', 'oceanFloat2', 'oceanFloat3'];
    const bubbles = [];

    // 读取缓存的位置信息
    var cachedPositions = wx.getStorageSync('bubblePositions') || {};

    items.forEach((item, i) => {
      var size, x, y;
      var cached = cachedPositions[item.id];

      if (cached) {
        // 复用缓存位置，加微小浮动
        size = cached.size;
        x = cached.x + (Math.random() - 0.5) * 10;
        y = cached.y + (Math.random() - 0.5) * 10;
        // 边界修正
        x = Math.max(padding, Math.min(x, screenWidth - size - padding));
        y = Math.max(padding, Math.min(y, availableHeight - size - padding));
      } else {
        // 新 item 随机定位
        size = 75 + Math.random() * 25;
        var attempts = 0, valid = false;
        while (!valid && attempts < 30) {
          x = padding + Math.random() * (screenWidth - size - padding * 2);
          y = padding + Math.random() * (availableHeight - size - padding * 2);
          valid = true;
          for (var j = 0; j < bubbles.length; j++) {
            var b = bubbles[j];
            var dx = (x + size / 2) - (b.x + b.size / 2);
            var dy = (y + size / 2) - (b.y + b.size / 2);
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < (size + b.size) / 2 + 10) {
              valid = false;
              break;
            }
          }
          attempts++;
        }
      }

      bubbles.push({
        ...item,
        size,
        x,
        y,
        floatClass: floatClasses[i % floatClasses.length],
        animDelay: (i * 0.08).toFixed(2),
        animDuration: (4 + Math.random() * 4).toFixed(1)
      });
    });

    // 缓存位置
    var newPositions = {};
    bubbles.forEach(function(b) {
      newPositions[b.id] = { x: b.x, y: b.y, size: b.size };
    });
    wx.setStorageSync('bubblePositions', newPositions);

    this.setData({ bubbles });
  },

  // --- Bubble & checkin ---
  onBubbleTap(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ showModal: true, currentItem: item, remarkInput: '' });
  },

  onBubbleLongPress(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({ url: '/pages/add/add?id=' + item.id });
  },

  onRemarkInput(e) {
    this.setData({ remarkInput: e.detail.value });
  },

  onConfirmCheckin() {
    const { currentItem, remarkInput, bubbles } = this.data;
    if (!currentItem) return;

    request({
      url: '/api/record/checkin',
      method: 'POST',
      data: { itemId: currentItem.id, remark: remarkInput }
    }).then(() => {
      this.setData({ showModal: false, currentItem: null, remarkInput: '' });
      wx.showToast({ title: '打卡成功!', icon: 'success' });

      // 找到对应气泡，播放破裂动画
      var idx = -1;
      for (var i = 0; i < bubbles.length; i++) {
        if (bubbles[i].id === currentItem.id) { idx = i; break; }
      }
      if (idx !== -1) {
        this.setData({ ['bubbles[' + idx + '].popping']: true });
        // 等待破裂动画完成后再刷新数据
        setTimeout(function() {
          this.loadItems();
        }.bind(this), 500);
      } else {
        this.loadItems();
      }
    });
  },

  onCancelModal() {
    this.setData({ showModal: false, currentItem: null, remarkInput: '' });
  },

  preventBubble() {},

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  },

  // --- Draggable robot ---
  onRobotTouchStart(e) {
    const touch = e.touches[0];
    this._robotStartTouch = { x: touch.clientX, y: touch.clientY };
    this._robotOrigin = { x: this.data.robotX, y: this.data.robotY };
    this.setData({ robotMoved: false });
  },

  onRobotTouchMove(e) {
    const touch = e.touches[0];
    const dx = touch.clientX - this._robotStartTouch.x;
    const dy = touch.clientY - this._robotStartTouch.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      this.setData({ robotMoved: true });
    }

    const { screenWidth } = this.data;
    const sysInfo = wx.getWindowInfo();
    const btnSize = 44; // ~88rpx

    let newX = this._robotOrigin.x + dx;
    let newY = this._robotOrigin.y + dy;

    // Boundary constraints
    newX = Math.max(0, Math.min(newX, screenWidth - btnSize));
    newY = Math.max(0, Math.min(newY, sysInfo.windowHeight - btnSize));

    this.setData({ robotX: newX, robotY: newY });
  },

  onRobotTouchEnd() {
    if (!this.data.robotMoved) {
      wx.navigateTo({ url: '/pages/chat/chat' });
    }
  }
});
