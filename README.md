# 📝 素材灵感管理平台

> 一款面向内容创作者的素材收集、管理与AI辅助创作平台

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

## ✨ 功能特性

### 📦 素材管理
- **多类型支持**: 文本、链接、图片、灵感速记四种素材类型
- **智能解析**: 自动解析网页标题、内容和图片
- **图片上传**: 支持图片上传与本地存储
- **收藏夹**: 快速收藏重要素材
- **搜索过滤**: 按类型、关键词、时间筛选素材

### 🤖 AI 功能
- **AI 摘要**: 自动生成素材内容摘要
- **AI 标签**: 智能推荐内容标签
- **灵感方向**: 提供创作灵感与方向建议
- **智能关联**: AI分析素材相关性，推荐关联内容

### 💬 AI 对话检索
- 通过自然语言对话检索相关素材
- 支持模糊搜索和语义理解
- 对话中直接引用素材内容

### 🔥 热门发现
- **多平台热搜**: 微博、知乎、抖音、B站、小红书、今日头条、百度热搜
- **AI 热榜**: AI领域最新动态与热点（实时更新）
- **一键收藏**: 热点内容快速保存到素材库

### ✍️ AI 写作助手
- **文章生成**: 基于素材生成完整文章（1000-2000字）
- **大纲生成**: 快速生成文章结构大纲
- **内容扩展**: 扩展深化已有内容
- **内容改写**: 优化改写现有内容
- **多种风格**: 专业严谨、轻松口语、学术风格、故事化

### 📁 文件夹管理
- **树形结构**: 支持文件夹嵌套分类
- **自定义样式**: 自定义图标和颜色
- **拖拽排序**: 灵活调整文件夹顺序
- **批量移动**: 素材批量移动到文件夹

### 📤 导出功能
- **Markdown**: 完整格式文档导出
- **JSON**: 结构化数据导出
- **纯文本**: 简洁文本格式导出

---

## 🛠 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.1 | React 全栈框架 |
| TypeScript | 5.0 | 类型安全 |
| Prisma | 6.19 | ORM 数据库工具 |
| SQLite | - | 轻量级数据库 |
| Tailwind CSS | 4.0 | 原子化 CSS |
| shadcn/ui | latest | UI 组件库 |
| AI SDK | - | z-ai-web-dev-sdk |
| Lucide Icons | - | 图标库 |

---

## 📦 安装与运行

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/dav-niu474/write-assist.git
cd write-assist

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 初始化数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

### 访问应用

打开浏览器访问: http://localhost:3000

---

## 📁 项目结构

```
write-assist/
├── prisma/
│   └── schema.prisma      # 数据库模型定义
├── public/
│   └── uploads/           # 上传文件存储
├── src/
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   ├── ai-write/  # AI写作助手
│   │   │   ├── chat/      # AI对话
│   │   │   ├── discover/  # 热门发现
│   │   │   ├── export/    # 导出功能
│   │   │   ├── folders/   # 文件夹管理
│   │   │   └── materials/ # 素材管理
│   │   ├── layout.tsx
│   │   └── page.tsx       # 主页面
│   ├── components/
│   │   ├── ui/            # UI组件
│   │   ├── ai-write-panel.tsx
│   │   ├── chat-panel.tsx
│   │   └── discover-panel.tsx
│   ├── hooks/             # 自定义 Hooks
│   └── lib/
│       ├── db.ts          # 数据库连接
│       └── utils.ts       # 工具函数
├── db/
│   └── custom.db          # SQLite 数据库文件
└── package.json
```

---

## 📊 数据模型

```
┌─────────────┐     ┌─────────────┐
│   Folder    │────<│  Material   │
├─────────────┤     ├─────────────┤
│ id          │     │ id          │
│ name        │     │ type        │
│ icon        │     │ title       │
│ color       │     │ content     │
│ parentId    │     │ sourceUrl   │
│ sortOrder   │     │ summary     │
└─────────────┘     │ aiTags      │
                    │ folderId    │
┌─────────────┐     └─────────────┘
│    Draft    │
├─────────────┤     ┌─────────────┐
│ id          │     │    Tag      │
│ title       │     ├─────────────┤
│ content     │     │ id          │
│ prompt      │     │ name        │
│ sourceIds   │     │ color       │
└─────────────┘     │ count       │
                    └─────────────┘
```

---

## 🗓️ 版本历史

### v1.1.0 (2026-03-28) - OCR与增强功能

**新增功能**
- ✅ OCR识别: 图片文字识别（Tesseract.js，支持中英文）
- ✅ 标签管理: 自动提取标签、标签云展示
- ✅ 素材统计: 收藏统计、类型分布、30天趋势图、热门标签
- ✅ 批量导入: 支持批量导入文本和链接素材
- ✅ 素材去重: 自动检测重复素材

**API接口**
- `POST /api/ocr` - OCR文字识别
- `GET /api/stats` - 素材统计数据
- `GET/POST /api/tags` - 标签管理
- `POST /api/materials/batch` - 批量导入素材

### v1.0.0 (2026-03-28) - 首个正式版本

**核心功能**
- ✅ 素材管理（文本、链接、图片、灵感速记）
- ✅ AI摘要、标签、灵感方向
- ✅ AI对话检索素材
- ✅ 多平台热搜发现
- ✅ AI热榜（实时AI热点）
- ✅ 文件夹分类管理
- ✅ AI写作助手
- ✅ 素材导出（MD/JSON/TXT）
- ✅ 智能关联推荐

**技术实现**
- Next.js 16 + TypeScript
- Prisma ORM + SQLite
- shadcn/ui + Tailwind CSS
- AI SDK 集成

---

## 🚀 版本升级拓展计划

### v1.1.0 - OCR与增强功能 (计划中)

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 🖼️ OCR识别 | 图片文字识别（Tesseract.js） | 高 |
| 🏷️ 标签管理 | 自定义标签、标签云展示 | 高 |
| 📊 素材统计 | 收藏统计、类型分布、时间趋势 | 中 |
| 📋 批量导入 | 批量导入文本、链接 | 中 |
| 🔄 素材去重 | 检测重复素材并合并 | 低 |

### v1.2.0 - 浏览器插件 (计划中)

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 🔌 Chrome插件 | 一键收藏网页内容 | 高 |
| 📱 右键菜单 | 选中文字快速收藏 | 高 |
| 🖼️ 图片收藏 | 右键收藏图片 | 中 |

### v1.3.0 - MediaCrawler集成 (计划中)

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 📕 小红书抓取 | 抓取小红书笔记内容 | 高 |
| 🎵 抖音抓取 | 抓取抖音视频信息 | 高 |
| 📺 B站抓取 | 抓取B站视频内容 | 中 |
| 🔄 定时同步 | 定时同步关注账号更新 | 低 |

### v1.4.0 - 高级功能 (计划中)

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 🔔 热点订阅 | 订阅特定话题自动追踪 | 高 |
| 📅 日历视图 | 按时间查看素材收藏 | 中 |
| 📝 素材版本 | 记录素材修改历史 | 中 |
| 🎨 自定义主题 | 深色模式、主题色定制 | 低 |
| 🔐 数据备份 | 数据导出与恢复 | 高 |

### v2.0.0 - 团队协作版 (远期规划)

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 👥 多用户支持 | 用户注册与登录 | 高 |
| 🤝 团队协作 | 共享素材库 | 高 |
| 💬 评论系统 | 素材评论与讨论 | 中 |
| 🔗 分享功能 | 素材外部分享链接 | 中 |
| ☁️ 云端同步 | 多设备数据同步 | 高 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📮 联系方式

- GitHub: [@dav-niu474](https://github.com/dav-niu474)
- 项目地址: [write-assist](https://github.com/dav-niu474/write-assist)

---

<p align="center">
  Made with ❤️ by dav-niu474
</p>
