# coopjz.github.io

个人网站：React + Vite + TypeScript 纯静态站点，可交互终端主页 + Markdown 博客，GitHub Actions 自动部署到 GitHub Pages。

## 本地开发

```bash
npm install
npm run dev      # 本地预览（热更新）
npm run build    # 构建 + TS 检查
npm run preview  # 预览构建产物
```

博客目前暂时关闭；需要恢复时，将 `src/config.ts` 中的 `features.blog` 改为 `true`。

## 写博客

在 `src/posts/` 下新建 `.md` 文件，带上 frontmatter：

```markdown
---
title: 文章标题
date: 2026-10-28
description: 一句话摘要
tags: [tag1, tag2]
---

正文……
```

push 到 `main` 后自动发布，列表按日期倒序。

## 修改个人信息

编辑 `src/config.ts`：姓名、当前身份、研究方向、GitHub 和邮箱。主页直接展示个人信息；终端支持 help、whoami、about、blog、github、ls、pwd、clear，以及 ↑/↓ 历史、Tab 补全、Ctrl+L 清屏。

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库 `<你的用户名>.github.io`
2. push 代码：
   ```bash
   git init
   git add .
   git commit -m "init: personal website"
   git remote add origin git@github.com:<你的用户名>/<你的用户名>.github.io.git
   git push -u origin main
   ```
3. 仓库 Settings → Pages → Source 选择 **GitHub Actions**（只需设置一次）
4. 之后每次 push 自动构建发布
