# B站舆情分析助手

> 一款 Chrome / Edge 浏览器扩展，用于分析哔哩哔哩（Bilibili）视频评论情感、高频话题和意见领袖账号，支持用户画像分析和视频舆情分析两大核心功能。

## 功能概览

### 视频舆情分析

在「视频舆情分析」页面输入B站视频链接，自动获取评论数据并进行多维度分析：

- **情感分析**：正面/中性/负面情感分类，情感比例饼图
- **情感趋势**：按时间维度展示情感变化曲线
- **关键词词云**：提取评论高频词，可视化展示
- **意见领袖（KOL）识别**：按点赞数和评论数排序，识别活跃用户
- **评论样本**：展示热门评论，按点赞数排序

### 用户画像分析

在「用户画像分析」页面输入B站用户主页链接，自动获取用户信息和视频列表进行分析：

- **基础画像**：昵称、签名、粉丝数、关注数、视频数、总播放量、总点赞量
- **活跃趋势**：按月统计发文频率，折线图展示
- **兴趣领域分布**：基于视频标题和描述分类（科技、游戏、生活、知识、娱乐等）
- **情感倾向分析**：综合视频标题和评论的情感判断
- **发文词云**：融合视频标题、描述和评论文本生成词云
- **参与话题**：提取视频中的热门话题标签
- **粉丝互动排行**：点赞排行和评论排行（从热门视频评论中聚合）

## 安装方式

### 方式一：在线下载安装（推荐）

1. 访问安装网站：[https://bili-yuqing-assistant.vercel.app](https://bili-yuqing-assistant.vercel.app)
2. 点击「下载安装包」，下载 `bili-yuqing-assistant.zip`
3. 解压到任意文件夹
4. 打开浏览器扩展管理页：
   - Chrome：地址栏输入 `chrome://extensions/`
   - Edge：地址栏输入 `edge://extensions/`
5. 开启「开发者模式」
6. 点击「加载已解压的扩展程序」，选择解压后的 `bili-yuqing-assistant` 文件夹
7. 安装完成后，点击浏览器右上角扩展图标即可打开分析页面

### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/fangyuuu888-bot/bili-yuqing-assistant.git
cd bili-yuqing-assistant

# 安装依赖
npm install

# 构建扩展
npm run build

# 构建产物在 dist/ 目录，按上述步骤4-7加载
```

## 使用说明

### 视频舆情分析

1. 点击浏览器右上角扩展图标，打开仪表盘
2. 切换到「视频舆情分析」标签页
3. 在输入框中粘贴B站视频链接（如 `https://www.bilibili.com/video/BV1xx...`）
4. 点击「开始分析」
5. 等待采集完成，查看分析结果

> 也可以在B站视频页面直接点击扩展图标，使用「采集评论」功能，再回到仪表盘分析。

### 用户画像分析

1. 切换到「用户画像分析」标签页
2. 在输入框中粘贴B站用户主页链接（如 `https://space.bilibili.com/12345678`）
3. 点击「开始分析」
4. 等待采集完成，查看用户画像

> 也可以在B站用户主页直接点击扩展图标，使用「采集用户画像」功能，再回到仪表盘分析。

## 技术架构

### 技术栈

| 组件 | 技术 |
|------|------|
| 浏览器扩展 | Manifest V3 |
| 前端构建 | Vite + ECharts |
| 情感分析 | 本地情感词典 + 规则匹配（无需外部API） |
| 安装网站 | 静态HTML，部署于 Vercel |
| 安装包托管 | GitHub Releases |
| CI/CD | GitHub Actions |

### 项目结构

```
bili-yuqing-assistant/
├── src/                        # 前端源码
│   ├── main.js                 # 仪表盘主逻辑（分析、渲染、交互）
│   ├── sentiment.js            # 情感分析模块（正面/负面词典 + 规则匹配）
│   ├── charts.js               # ECharts 图表渲染（趋势、词云、饼图等）
│   ├── mockData.js             # 数据模型和平台配置
│   ├── chinaMap.js             # 中国地图数据（地域分布）
│   └── style.css               # 仪表盘样式
├── public/                     # 扩展静态资源
│   ├── manifest.json           # 扩展清单（Manifest V3）
│   ├── background.js           # Service Worker（消息中转、API调用、数据存储）
│   ├── popup.html / popup.js   # 扩展弹窗UI
│   ├── dashboard.html          # 仪表盘页面
│   ├── install.html            # 安装指南页面
│   └── content/                # Content Scripts
│       ├── bilibili.js         # 视频页评论采集脚本
│       └── user_profile.js    # 用户主页画像采集脚本（DOM优先 + API补充）
├── dist/                       # 构建产物（可直接加载为扩展）
├── website/                    # 安装网站源码（部署到 Vercel）
│   ├── index.html              # 安装网站首页
│   ├── install.html            # 安装指南页
│   ├── vercel.json             # Vercel 部署配置
│   └── bili-yuqing-assistant.zip  # 扩展安装包
├── .github/workflows/          # GitHub Actions
│   ├── release.yml             # 自动创建 Release 并上传安装包
│   └── pages.yml               # GitHub Pages 部署
├── vite.config.js              # Vite 构建配置
└── package.json
```

### 核心模块说明

#### background.js（Service Worker）

负责扩展后台逻辑，处理以下消息：

| 消息类型 | 功能 |
|----------|------|
| `FETCH_PROFILE_BY_URL` | 通过用户主页链接获取完整画像（用户信息 → 视频列表 → 评论 → 排行） |
| `FETCH_VIDEO_COMMENTS_BY_URL` | 通过视频链接获取评论数据 |
| `SAVE_COMMENTS` / `GET_COMMENTS` | 评论数据存储与读取 |
| `SAVE_PROFILE` / `GET_LATEST_PROFILE` | 用户画像存储与读取 |
| `COLLECT_PROGRESS` / `GET_COLLECT_PROGRESS` | 采集进度通知 |

#### 情感分析（sentiment.js）

完全本地运行，不依赖外部API：

- **正面词典**：150+ 词语（好、棒、赞、yyds、绝绝子等）
- **负面词典**：100+ 词语（差、烂、失望、无聊等）
- **规则匹配**：否定词反转（"不好" → 负面）、程度副词加权（"非常" + 正面词）
- **情感评分**：每条评论计算正面/负面得分，取较高者作为情感标签

#### 用户画像采集（user_profile.js）

采用 **DOM优先 + API补充** 策略，应对B站API限制：

1. 用户信息从页面DOM提取（昵称、签名等）
2. 视频列表通过三端点分页获取：
   - `x/space/wbi/arc/search`（WBI签名版）
   - `x/space/arc/search`（旧版）
   - `x/polymer/web-dynamic/v1/feed/space`（动态流）
3. 视频详情通过 `x/web-interface/view` 补充（播放量、点赞等）
4. BV号去重确保视频列表完整

#### 评论文本清理（cleanCommentText）

三级清理机制，过滤B站评论中的图片URL和文件名：

1. **采集层**（background.js）：采集评论时清理
2. **分析层**（main.js）：传入分析前清理
3. **渲染层**（main.js）：显示前清理

### B站API端点

| 用途 | API |
|------|-----|
| 用户信息 | `x/space/wbi/acc/info`、`x/web-interface/card` |
| 粉丝数据 | `x/relation/stat` |
| 视频列表 | `x/space/wbi/arc/search`、`x/space/arc/search`、`x/polymer/web-dynamic/v1/feed/space` |
| 视频详情 | `x/web-interface/view` |
| 评论数据 | `x/v2/reply/main` |

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

### 调试扩展

1. 构建后在 `dist/` 目录加载扩展
2. 点击扩展图标打开仪表盘
3. 按 F12 打开开发者工具
4. Service Worker 日志在 `chrome://extensions/` → 扩展详情 → "检查视图：service worker"

### 生成图标

```bash
node generate-icons.cjs
```

### 打包安装包

```bash
# 在 PowerShell 中运行
.\build\create-zip.ps1
# 或手动将 dist/ 内容打包为 bili-yuqing-assistant.zip
```

## 部署

### 安装网站（Vercel）

- 仓库 `website/` 目录自动部署到 Vercel
- 配置：Root Directory = `website`，Build Command = `exit 0`
- 域名：`https://bili-yuqing-assistant.vercel.app`

### 安装包（GitHub Releases）

- 推送代码到 `main` 分支后，GitHub Actions 自动创建 Release
- 下载链接：`https://github.com/fangyuuu888-bot/bili-yuqing-assistant/releases/download/latest/bili-yuqing-assistant.zip`

## 浏览器兼容性

- Chrome 88+（Manifest V3 要求）
- Edge 88+
- 其他基于 Chromium 的浏览器（Brave、Opera 等）

## 已知限制

- B站部分API需要WBI签名，未登录时可能返回错误码 -799（请求过于频繁）
- 评论采集最多支持10页（约300条）
- 情感分析基于词典匹配，准确率约80%，无法理解复杂语境（如反讽）
- 用户画像的兴趣领域分类依赖关键词匹配，覆盖范围有限

## 许可证

MIT License

## 链接

- **安装网站**：[https://bili-yuqing-assistant.vercel.app](https://bili-yuqing-assistant.vercel.app)
- **GitHub 仓库**：[https://github.com/fangyuuu888-bot/bili-yuqing-assistant](https://github.com/fangyuuu888-bot/bili-yuqing-assistant)
- **问题反馈**：[https://github.com/fangyuuu888-bot/bili-yuqing-assistant/issues](https://github.com/fangyuuu888-bot/bili-yuqing-assistant/issues)
