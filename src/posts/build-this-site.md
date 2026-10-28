---
title: 我是如何搭建这个网站的
date: 2026-10-20
description: 从空目录到 GitHub Pages：技术选型、agnoster 终端风 Hero 的实现思路。
tags: [react, vite, github-pages]
---

## 技术选型

目标：纯前端、零成本托管、写完 Markdown 推上去就自动发布。

最后选了 **React + Vite + TypeScript**，博客文章用 `import.meta.glob` 在构建时收集，运行时用 markdown-it 渲染。

## 终端风 Hero

主页的终端窗口模仿的是 oh-my-zsh 的 **agnoster** 主题：

1. 分段提示符：`user@host` → 路径 → git 分支
2. 段间箭头用 CSS `clip-path` 绘制，访客不需要安装 Powerline 字体
3. 打字机动画依次执行命令，展示个人信息

```css
.arrow {
  width: 0.8em;
  clip-path: polygon(0 0, 0 100%, 100% 50%);
}
```

## 部署

GitHub Actions 在 push 到 `main` 后自动构建并发布到 Pages，全程无需手动操作。
