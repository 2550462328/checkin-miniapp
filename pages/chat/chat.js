const { request } = require('../../utils/request');

Page({
  data: {
    messages: [],
    inputText: '',
    sending: false,
    connected: false,
    scrollToView: '',
    previewImages: [],
    showSubscribeGuide: false,
    mdTagStyle: {
      p: 'color:#fff;margin:0;',
      h1: 'color:#fff;font-size:18px;margin:8px 0;',
      h2: 'color:#fff;font-size:17px;margin:8px 0;',
      h3: 'color:#fff;font-size:16px;margin:6px 0;',
      h4: 'color:#fff;font-size:15px;margin:6px 0;',
      li: 'color:#fff;',
      ul: 'color:#fff;margin:4px 0;padding-left:20px;',
      ol: 'color:#fff;margin:4px 0;padding-left:20px;',
      code: 'background:rgba(0,0,0,0.3);color:#e6db74;padding:2px 6px;border-radius:4px;font-size:13px;',
      pre: 'background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;overflow-x:auto;margin:8px 0;',
      blockquote: 'border-left:3px solid rgba(255,255,255,0.4);padding-left:10px;color:rgba(255,255,255,0.8);margin:8px 0;',
      a: 'color:#a8d8ff;',
      strong: 'color:#fff;',
      em: 'color:#fff;',
      table: 'border-collapse:collapse;width:100%;margin:8px 0;',
      thead: '',
      tbody: '',
      tr: '',
      th: 'color:#fff;border:1px solid rgba(255,255,255,0.3);padding:6px 8px;background:rgba(255,255,255,0.12);text-align:left;font-weight:600;',
      td: 'color:#fff;border:1px solid rgba(255,255,255,0.2);padding:6px 8px;',
      hr: 'border:none;border-top:1px solid rgba(255,255,255,0.3);margin:8px 0;',
      img: 'max-width:100%;border-radius:8px;margin:4px 0;'
    }
  },

  _pollTimer: null,
  _pendingAttachments: [],
  _userScrolling: false,
  _scrollAnchor: '',

  onLoad() {
    this.doConnect();
  },

  onUnload() {
    this.stopPoll();
    this.doDisconnect();
  },

  doConnect() {
    request({
      url: '/api/chat/connect',
      method: 'POST'
    }).then(() => {
      this.setData({ connected: true });
      this.loadHistory();
    }).catch(() => {
      wx.showToast({ title: '连接 AI 失败', icon: 'none' });
    });
  },

  loadHistory() {
    request({
      url: '/api/chat/history',
      method: 'GET'
    }).then(res => {
      const list = res.data || [];
      if (!list.length) return;

      const messages = list.map((item, i) => ({
        id: 'hist-' + i,
        role: item.role,
        text: item.text,
        loading: false
      }));
      this.setData({
        messages: messages,
        scrollToView: messages[messages.length - 1].id
      });
    }).catch(() => {});
  },

  doDisconnect() {
    request({
      url: '/api/chat/disconnect',
      method: 'POST'
    }).catch(() => {});
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  onChooseImage() {
    if (this.data.sending) return;
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = res.tempFiles;
        const previews = this.data.previewImages.slice();
        const fs = wx.getFileSystemManager();

        let pending = files.length;
        files.forEach(file => {
          if (file.size > 5 * 1024 * 1024) {
            wx.showToast({ title: '图片不能超过5MB', icon: 'none' });
            pending--;
            return;
          }
          const path = file.tempFilePath;
          const ext = path.split('.').pop().toLowerCase();
          const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
          const mimeType = mimeMap[ext] || 'image/jpeg';

          fs.readFile({
            filePath: path,
            encoding: 'base64',
            success: (readRes) => {
              previews.push({
                path: path,
                base64: readRes.data,
                mimeType: mimeType,
                fileName: 'image.' + ext,
                isFile: false
              });
              pending--;
              if (pending <= 0) {
                this.setData({ previewImages: previews });
              }
            },
            fail: () => {
              pending--;
              if (pending <= 0) {
                this.setData({ previewImages: previews });
              }
            }
          });
        });
      }
    });
  },

  onChooseFile() {
    if (this.data.sending) return;
    wx.chooseMessageFile({
      count: 3,
      type: 'file',
      success: (res) => {
        const files = res.tempFiles;
        const previews = this.data.previewImages.slice();
        const fs = wx.getFileSystemManager();

        let pending = files.length;
        files.forEach(file => {
          if (file.size > 5 * 1024 * 1024) {
            wx.showToast({ title: '文件不能超过5MB', icon: 'none' });
            pending--;
            return;
          }
          const path = file.path;
          const name = file.name || path.split('/').pop();
          const ext = name.split('.').pop().toLowerCase();
          var mimeType = 'application/octet-stream';
          var mimeMap = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            txt: 'text/plain',
            md: 'text/markdown',
            json: 'application/json',
            csv: 'text/csv'
          };
          if (mimeMap[ext]) mimeType = mimeMap[ext];

          fs.readFile({
            filePath: path,
            encoding: 'base64',
            success: (readRes) => {
              previews.push({
                path: path,
                base64: readRes.data,
                mimeType: mimeType,
                fileName: name,
                isFile: true
              });
              pending--;
              if (pending <= 0) {
                this.setData({ previewImages: previews });
              }
            },
            fail: () => {
              pending--;
              wx.showToast({ title: '读取文件失败', icon: 'none' });
              if (pending <= 0) {
                this.setData({ previewImages: previews });
              }
            }
          });
        });
      }
    });
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const previews = this.data.previewImages.slice();
    previews.splice(idx, 1);
    this.setData({ previewImages: previews });
  },

  onSend() {
    const text = this.data.inputText.trim();
    const images = this.data.previewImages;
    if ((!text && !images.length) || this.data.sending) return;

    const attachments = images.map(img => ({
      type: img.isFile ? 'file' : 'image',
      mimeType: img.mimeType,
      content: img.base64,
      fileName: img.fileName
    }));

    const userMsg = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: text || (images.some(i => i.isFile) ? '[ 文件 ]' : '[ 图片 ]'),
      images: images.filter(i => !i.isFile).map(img => img.path),
      files: images.filter(i => i.isFile).map(img => img.fileName),
      loading: false
    };
    const aiMsg = {
      id: 'msg-' + (Date.now() + 1),
      role: 'ai',
      text: '',
      loading: true
    };

    const messages = this.data.messages.concat([userMsg, aiMsg]);
    this._userScrolling = false;
    this._scrollAnchor = aiMsg.id;
    this.setData({
      messages: messages,
      inputText: '',
      previewImages: [],
      sending: true,
      scrollToView: aiMsg.id
    });

    const sendData = { message: text || (images.some(i => i.isFile) ? '请分析这个文件' : '请描述这张图片') };
    if (attachments.length) {
      sendData.attachments = attachments;
    }

    request({
      url: '/api/chat/send',
      method: 'POST',
      data: sendData
    }).then(() => {
      this.startPoll(aiMsg.id);
    }).catch(() => {
      this.updateAiMessage(aiMsg.id, '发送失败，请重试', true);
    });
  },

  startPoll(aiMsgId) {
    this.stopPoll();
    this._pollTimer = setInterval(() => {
      request({
        url: '/api/chat/poll',
        method: 'GET'
      }).then(res => {
        const { text, done } = res.data;
        this.updateAiMessage(aiMsgId, text, done);
        if (done) {
          this.stopPoll();
          this.tryRequestSubscribe(text);
        }
      }).catch(() => {
        this.stopPoll();
        this.updateAiMessage(aiMsgId, '连接中断，请重试', true);
      });
    }, 800);
  },

  stopPoll() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  onScroll(e) {
    var distanceToBottom = e.detail.scrollHeight - e.detail.scrollTop - e.detail.clientHeight;
    if (distanceToBottom > 120) {
      this._userScrolling = true;
    } else {
      this._userScrolling = false;
    }
  },

  onScrollToLower() {
    this._userScrolling = false;
  },

  updateAiMessage(msgId, text, done) {
    const messages = this.data.messages.map(m => {
      if (m.id === msgId) {
        return { ...m, text: text, loading: !done };
      }
      return m;
    });
    var data = {
      messages: messages,
      sending: !done
    };
    if (!this._userScrolling) {
      this._scrollAnchor = this._scrollAnchor === msgId ? msgId + '-end' : msgId;
      data.scrollToView = this._scrollAnchor;
    }
    if (done) {
      this._userScrolling = false;
    }
    this.setData(data);
  },

  tryRequestSubscribe(text) {
    if (!text || text.indexOf('我需要用户授权哈') === -1) return;
    this.setData({ showSubscribeGuide: true });
  },

  onConfirmChatSubscribe() {
    this.setData({ showSubscribeGuide: false });
    var that = this;
    wx.requestSubscribeMessage({
      tmplIds: ['wyLt5Sbynt3y7nx0raeuUpTf9KLqB8HYmPDEiyoFWjQ'],
      success: function (res) {
        if (res['wyLt5Sbynt3y7nx0raeuUpTf9KLqB8HYmPDEiyoFWjQ'] === 'accept') {
          request({
            url: '/api/user/subscribe',
            method: 'POST'
          }).then(function () {
            that.sendAutoReply('已授权');
          }).catch(function () {
            that.sendAutoReply('已授权');
          });
        } else {
          that.sendAutoReply('取消提醒');
        }
      },
      fail: function () {
        that.sendAutoReply('取消提醒');
      }
    });
  },

  onCancelChatSubscribe() {
    this.setData({ showSubscribeGuide: false });
    this.sendAutoReply('取消提醒');
  },

  sendAutoReply(text) {
    var userMsg = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: text,
      loading: false
    };
    var aiMsg = {
      id: 'msg-' + (Date.now() + 1),
      role: 'ai',
      text: '',
      loading: true
    };

    var messages = this.data.messages.concat([userMsg, aiMsg]);
    this._userScrolling = false;
    this._scrollAnchor = aiMsg.id;
    this.setData({
      messages: messages,
      sending: true,
      scrollToView: aiMsg.id
    });

    var that = this;
    request({
      url: '/api/chat/send',
      method: 'POST',
      data: { message: text }
    }).then(function () {
      that.startPoll(aiMsg.id);
    }).catch(function () {
      that.updateAiMessage(aiMsg.id, '发送失败，请重试', true);
    });
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.src;
    wx.previewImage({ current: url, urls: [url] });
  },

  preventBubble() {}
});
