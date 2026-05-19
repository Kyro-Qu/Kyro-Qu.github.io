---
title: "用 Hugo 和 GitHub Pages 搭起我的博客"
subtitle: "从本地写作区到自动部署站点的第一步"
date: 2026-05-19T20:45:00+08:00
draft: false
tags: ["Hugo", "GitHub Pages", "博客"]
featured: true
mood: "focus"
description: "记录 Kyro Blog 的初始搭建过程和目录规划。"
---

这个博客的第一版，先把最重要的工作流搭起来：

1. 本地写作和整理资料。
2. 把准备发布的文章同步到站点内容目录。
3. 推送到 GitHub 后自动部署到 GitHub Pages。

## 目录规划

我把本地工作区拆成了两部分：

```text
KyroBlog/
|-- authoring/   # 本地写作、草稿、素材、说明文档
|-- site/        # 真正推送到 GitHub 的 Hugo 站点
|-- scripts/     # 本地辅助脚本
`-- tools/       # 便携版 Hugo
```

这样做的好处是很直接：

- 草稿、素材和私人说明不会误推到公开仓库
- 站点仓库保持干净，只保存发布所需内容
- 写作和部署可以分开管理

## 目前已经接好的内容

- Hugo 站点骨架
- LofiCode 主题
- GitHub Pages Actions 工作流
- 中文首页、关于页、联系页
- 本地草稿发布脚本

## 接下来怎么用

日常写作流程会非常固定：

1. 在 `authoring/drafts/` 新建文章草稿。
2. 写完后运行发布脚本，把文章复制到 `site/content/posts/`。
3. 本地预览确认无误后，提交并推送 `site/` 仓库。

等后面内容多起来，再继续加评论、友链、归档页或者自定义域名。
