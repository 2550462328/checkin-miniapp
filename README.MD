# 每日打卡小程序

一个基于微信小程序原生框架开发的习惯打卡客户端。用户可以创建每日、每周或指定日期的打卡项目，通过气泡式主页完成打卡，并查看历史记录和阶段统计。

## 功能特性

- 微信登录与用户身份关联
- 每日、每周和单次打卡项目管理
- 自定义项目名称、备注和气泡颜色
- 气泡式今日任务展示及打卡动画
- 最近 7 天、本月和全部历史记录
- 本周、本月打卡数据统计与图表展示
- 微信订阅消息授权与提醒
- AI 对话，支持图片及常见文档附件
- Markdown 内容渲染与代码高亮

## 技术栈

- 微信小程序原生框架（JavaScript、WXML、WXSS）
- Canvas 2D 图表
- `mp-html` 富文本与 Markdown 渲染组件
- 微信登录、订阅消息及媒体选择 API

## 项目结构

```text
checkin-miniapp/
|-- app.js                    # 应用入口、登录和全局配置
|-- app.json                  # 页面、窗口和 TabBar 配置
|-- app.wxss                  # 全局样式
|-- components/mp-html/       # Markdown/HTML 渲染组件
|-- pages/
|   |-- index/                # 今日打卡主页
|   |-- add/                  # 新增和编辑打卡项目
|   |-- history/              # 打卡历史
|   |-- stats/                # 数据统计
|   |-- chat/                 # AI 对话
|   `-- webview/              # 网页容器
|-- utils/request.js          # API 请求封装
|-- project.config.json       # 微信开发者工具项目配置
`-- sitemap.json              # 小程序索引配置
```

## 开发准备

1. 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 克隆仓库：

   ```bash
   git clone git@github.com:2550462328/checkin-miniapp.git
   ```

3. 在微信开发者工具中选择“导入项目”，目录指向仓库根目录。
4. 使用 `project.config.json` 中配置的 AppID，或替换为自己的小程序 AppID。
5. 在微信公众平台配置合法 request 域名，并确保后端服务可访问。
6. 点击微信开发者工具中的“编译”即可运行。

本项目不依赖 npm 构建流程，无需执行依赖安装命令。

## 服务端配置

默认 API 地址定义在 `app.js`：

```js
globalData: {
  userId: null,
  baseUrl: 'https://huitogo.club'
}
```

如需连接其他环境，请修改 `baseUrl`。服务端响应约定如下：

```json
{
  "code": 0,
  "data": {},
  "msg": ""
}
```

除登录接口外，请求封装会通过 `X-User-Id` 请求头传递当前用户 ID。主要接口前缀包括：

- `/api/user`：登录、功能开关和订阅消息
- `/api/item`：打卡项目查询与管理
- `/api/record`：打卡及历史记录
- `/api/stats`：统计数据
- `/api/chat`：AI 对话连接、发送、轮询与历史记录

## 注意事项

- 订阅消息模板 ID 当前直接配置在页面代码中，更换小程序主体时需要同步替换。
- AI 对话附件单个文件限制为 5 MB，最多选择 3 个。
- `project.private.config.json` 属于本机微信开发者工具配置，不纳入版本控制。
- 仓库仅包含小程序客户端，运行完整功能需要配套后端服务。

## License

本项目暂未声明开源许可证。
