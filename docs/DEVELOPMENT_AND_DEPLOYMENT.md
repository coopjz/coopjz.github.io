# 开发与部署流程

本文档说明个人主页从本地开发、构建检查，到推送并发布到 GitHub Pages 的完整流程。

## 项目信息

- 仓库：`https://github.com/coopjz/coopjz.github.io`
- 网站：`https://coopjz.github.io/`
- 源代码分支：`main`
- GitHub Pages 发布分支：`master`
- 技术栈：React、Vite、TypeScript

## 1. 获取项目

首次使用：

```bash
git clone git@github.com:coopjz/coopjz.github.io.git
cd coopjz.github.io
npm ci
```

已有本地仓库时：

```bash
cd /path/to/coopjz.github.io
git pull origin main
npm ci
```

项目需要 Node.js 22。GitHub Actions 使用的也是 Node.js 22。

## 2. 本地开发

启动 Vite 开发服务器：

```bash
npm run dev
```

默认访问地址为 `http://localhost:5173`。如果端口被占用，Vite 会自动选择其他端口。

常用代码位置：

| 文件 | 用途 |
| --- | --- |
| `src/config.ts` | 姓名、学校、研究方向、联系方式等个人信息 |
| `src/components/Terminal.tsx` | 主页终端、命令解析和彩蛋 |
| `src/styles.css` | 全局布局、终端和响应式样式 |
| `src/pages/Home.tsx` | 主页页面 |
| `src/posts/` | Markdown 博客文章 |

修改后直接刷新浏览器即可看到开发环境中的变化。

## 3. 构建检查

运行生产构建：

```bash
npm run build
```

该命令会先执行 TypeScript 类型检查，再用 Vite 生成生产文件。构建结果位于 `dist/`。

预览生产构建：

```bash
npm run preview
```

提交前建议检查：

```bash
git diff --check
git status
```

## 4. 提交代码

先查看修改内容：

```bash
git diff
```

确认无误后提交：

```bash
git add .
git commit -m "Describe the change"
```

## 5. 推送并触发部署

将源代码推送到 `main`：

```bash
git push origin main
```

推送到 `main` 后，`.github/workflows/deploy.yml` 会自动启动 GitHub Actions。

部署流程如下：

```text
main 源代码
    ↓
GitHub Actions
    ↓
npm ci && npm run build
    ↓
生成 dist/
    ↓
更新 master 发布分支
    ↓
请求 GitHub Pages 构建
    ↓
https://coopjz.github.io/
```

GitHub Actions 会完成以下步骤：

1. 检出 `main` 分支。
2. 安装 Node.js 22 和 npm 依赖。
3. 执行 `npm run build`。
4. 检出 `master` 分支。
5. 用新的 `dist/` 内容替换 `master` 中的静态文件。
6. 将更新后的 `master` 推送到 GitHub。
7. 请求 GitHub Pages 重新构建网站。

日常开发不需要手动修改或推送 `master`。

## 6. 查看部署状态

在 GitHub 仓库中打开：

```text
Actions → Deploy to GitHub Pages
```

也可以在命令行检查网站响应：

```bash
curl -I https://coopjz.github.io/
```

看到 `HTTP/2 200` 通常表示网站可以正常访问。GitHub Pages 的缓存更新可能需要短暂时间。

## 7. 推荐的日常流程

```bash
git pull origin main
npm ci
npm run dev

# 修改代码并在浏览器中检查

npm run build
git diff --check
git status

git add .
git commit -m "Describe the change"
git push origin main
```

推送成功后，等待 GitHub Actions 完成即可。
