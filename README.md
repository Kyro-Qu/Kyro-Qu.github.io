# Kyro Blog 站点仓库说明

这个目录是实际发布到 GitHub Pages 的 Hugo 站点仓库。

和上一级工作区的关系是：

- `authoring/` 负责写作、整理、暂存
- `site/` 负责发布、构建、部署

如果你要让线上博客发生变化，最终都必须落到这个目录里，并推送到 GitHub。

---

## 1. 当前仓库信息

- GitHub 仓库：
  `https://github.com/Kyro-Qu/Kyro-Qu.github.io`
- 线上地址：
  `https://kyro-qu.github.io/`
- 默认分支：
  `main`
- 部署方式：
  GitHub Actions + GitHub Pages

---

## 2. 目录结构说明

```text
site/
|-- .github/workflows/      # GitHub Actions 工作流
|   `-- hugo.yaml           # 推送 main 后自动构建并部署
|-- archetypes/             # Hugo 新建内容时的默认模板
|   `-- default.md
|-- content/                # 站点内容
|   |-- _index.md           # 首页内容
|   |-- about.md            # 关于页
|   |-- contact.md          # 联系页
|   `-- posts/              # 博客文章
|-- layouts/                # 本地模板覆盖
|   |-- _default/           # 单页、列表页等基础模板覆盖
|   `-- partials/           # 头部等局部模板覆盖
|-- static/                 # 静态资源，构建后原样输出
|   |-- css/                # 自定义 CSS
|   `-- images/             # 图片资源
|-- themes/                 # 主题目录
|   `-- loficode/           # 当前 Hugo 主题，使用 Git 子模块接入
|-- hugo.toml               # Hugo 主配置
|-- .gitmodules             # 主题子模块配置
`-- README.md               # 当前说明文档
```

---

## 3. 关键文件说明

### `hugo.toml`

这是 Hugo 主配置文件，负责定义：

- `baseURL`
- 站点标题
- 语言
- 首页和页面输出格式
- 菜单
- 作者头像
- 社交链接
- 高亮和目录设置

当前最常见会改的内容有：

- 站点标题
- 首页副标题
- 头像图片路径
- 菜单项
- GitHub 链接

### `.github/workflows/hugo.yaml`

这是 GitHub Actions 部署文件。

当你把改动推送到 `main` 时，它会自动：

1. 检出仓库
2. 拉取主题子模块
3. 安装 Hugo
4. 构建静态站点
5. 上传构建结果
6. 部署到 GitHub Pages

### `content/`

这里决定“网页显示什么内容”。

- `_index.md`
  首页正文
- `about.md`
  关于页
- `contact.md`
  联系页
- `posts/`
  博客文章

### `layouts/`

这里放的是“覆盖主题默认行为”的模板。

一般只有在这些情况下才需要改：

- 页面结构要调整
- 主题默认布局不满足需求
- 只想局部改某个页面，不想直接动主题源码

### `static/`

这里放静态文件，构建后会直接出现在站点根路径。

例如：

- `static/images/profile.png`
  最终访问路径是 `/images/profile.png`
- `static/css/custom.css`
  最终访问路径是 `/css/custom.css`

---

## 4. 本地开发和预览

### 从工作区根目录预览

推荐方式：

```powershell
.\scripts\Preview-Site.ps1
```

### 从站点目录直接预览

```powershell
..\tools\hugo\hugo.exe server -D
```

### 正式构建检查

推荐方式：

```powershell
..\scripts\Build-Site.ps1
```

或者直接执行：

```powershell
..\tools\hugo\hugo.exe --gc --minify
```

---

## 5. 从文章包发布到当前站点

如果你在上一级工作区使用的是“文章包模式”，例如：

```text
authoring/drafts/你的文章文件夹/
|-- post.ini
|-- article.md
`-- images/
```

那么推荐通过下面这个命令把它发布到当前站点仓库：

```powershell
python ..\scripts\publish_bundle.py "..\authoring\drafts\你的文章文件夹" --mode publish
```

覆盖旧文章：

```powershell
python ..\scripts\publish_bundle.py "..\authoring\drafts\你的文章文件夹" --mode overwrite
```

发布器会自动生成：

- `content/posts/<slug>.md`
- `static/images/posts/<slug>/...`

也就是说，这个仓库里的文章和图片有些是手工维护的，有些是通过文章包自动生成的。

---

## 6. 日常发布流程

### 如果你改的是文章

推荐在上一级工作区先写草稿，再发布到这里：

```powershell
..\scripts\Publish-Post.ps1 -DraftFile "2026-05-19-post.md"
```

发布后，再在当前目录提交和推送。

### 如果你改的是页面或样式

例如改：

- 关于页
- 联系页
- 头像
- CSS
- 布局模板

那通常直接修改 `site/` 内相关文件即可。

---

## 7. 如何推送到 GitHub

### 查看状态

```powershell
git status
```

### 添加改动

```powershell
git add .
```

如果你只想提交部分文件，也可以显式写路径：

```powershell
git add content/contact.md static/images/profile.png
```

### 提交

```powershell
git commit -m "Describe your change"
```

推荐提交信息示例：

- `Publish new post about Hugo workflow`
- `Update contact page`
- `Update profile image`
- `Refine custom styles`

### 推送

```powershell
git push origin main
```

推送后 GitHub Actions 会自动开始部署。

---

## 8. 如何首次初始化远端

如果这是新环境，或者还没有设置远端：

```powershell
git remote add origin https://github.com/Kyro-Qu/Kyro-Qu.github.io.git
git push -u origin main
```

设置完成后，后续只需要：

```powershell
git push origin main
```

---

## 9. GitHub Pages 设置说明

打开仓库网页后，检查：

`Settings -> Pages`

应确认：

- Source 为 `GitHub Actions`

然后在：

`Actions`

查看 `Build and deploy` 是否运行成功。

只有工作流成功后，线上页面才会更新。

---

## 10. 主题更新方式

当前主题通过 Git 子模块接入：

```powershell
git submodule update --remote themes/loficode
```

更新主题后建议立即做三件事：

1. 本地预览
2. 本地正式构建
3. 检查自定义模板覆盖是否仍然兼容

因为我们当前在 `layouts/` 和 `static/css/` 里已经有本地覆盖，主题升级后要特别注意兼容性。

---

## 11. 哪些目录最好不要手动维护

### `public/`

这是构建输出目录。  
不要把它当作源文件目录来改，重新构建后会被覆盖。

### `resources/`

这是 Hugo 构建缓存和资源目录。  
通常不需要手工编辑。

### `themes/loficode/`

这是主题子模块。  
如果只是想调整样式或布局，优先在本仓库的：

- `layouts/`
- `static/css/`

里做覆盖，而不是直接改主题源码。

---

## 12. 排查思路

### 推送成功了，但页面没更新

先检查：

1. `git push origin main` 是否真的成功
2. `Actions` 页是否有运行记录
3. 工作流是否失败
4. `Pages` 设置是否还是 `GitHub Actions`

### 本地能跑，线上样式不对

优先检查：

- 静态资源路径是否正确
- 是否漏提交了 `static/`、`layouts/` 或 `hugo.toml`
- 自定义 CSS 是否已经被 `head.html` 引入

### 页面内容乱码

优先确认文件是否使用 UTF-8 编码保存，尤其是：

- `content/*.md`
- `README.md`
- 自定义模板文件

---

## 13. 和工作区根目录的关系

如果你是从整个工作区使用这个博客项目，建议先读：

[../README.md](D:\WorkSpace\Project\KyroBlog\README.md)

它讲的是：

- 总体目录设计
- 从写草稿到上线的完整流程
- `authoring/` 与 `site/` 的分工
