# Kyro Blog 站点仓库说明

这个目录是实际发布到 GitHub Pages 的 Hugo 站点仓库。

当前线上仓库：

- 仓库：`Kyro-Qu/Kyro-Qu.github.io`
- 站点：[https://kyroqu.xyz/](https://kyroqu.xyz/)
- 分支：`main`
- 部署方式：GitHub Actions + GitHub Pages

和上一级工作区的关系可以简单理解成：

- `authoring/` 负责写作和整理
- `image-repos/` 负责文章正文配图
- `site/` 负责正文页面、站点配置和最终部署

---

## 当前目录结构

```text
site/
|-- .github/workflows/      # GitHub Actions 工作流
|   `-- hugo.yaml
|-- archetypes/             # Hugo 默认模板
|-- content/
|   |-- _index.md           # 首页正文
|   |-- about.md            # 关于页
|   |-- archive.md          # 归档页
|   |-- contact.md          # 联系页
|   `-- posts/              # 博客文章正文
|-- layouts/                # 本地模板覆盖
|-- static/
|   |-- css/                # 自定义样式
|   |-- images/             # 站点级图片资源
|   `-- js/                 # 自定义脚本
|-- themes/
|   `-- loficode/           # 当前主题子模块
|-- hugo.toml               # Hugo 主配置
`-- README.md
```

---

## 这个仓库现在负责什么

### 1. 页面和文章正文

主要在：

- `content/posts/*.md`
- `content/about.md`
- `content/contact.md`
- `content/archive.md`
- `content/_index.md`

### 2. 站点布局和主题覆盖

主要在：

- `layouts/`
- `static/css/`
- `static/js/`

### 3. 站点级图片

主要在：

- `static/images/`

适合放：

- 头像
- favicon
- 联系页二维码
- 不属于单篇文章的公共资源

---

## 这个仓库现在不再默认负责什么

当前项目已经接入外部图片仓，所以：

- 文章正文里的配图，不再推荐长期放在 `site/static/images/posts/`
- 图文文章默认推荐发布到 `blog-images-1`
- 正文里的图片链接一般会变成：
  `https://kyroqu.xyz/blog-images-1/posts/<slug>/<filename>`

也就是说：

- `site/` 主要保留正文、页面、样式和站点级资源
- `image-repos/blog-images-1` 负责文章正文配图

如果某篇文章使用的是 `image_mode = local`，那它的图片才会继续留在主站仓本地。

---

## 从文章包发布到当前站点

如果你在工作区上一级使用的是文章包模式，例如：

```text
authoring/drafts/你的文章文件夹/
|-- post.ini
|-- article.md
`-- images/
```

推荐命令：

```powershell
python ..\scripts\publish_bundle.py "..\authoring\drafts\你的文章文件夹" --mode publish
python ..\scripts\publish_bundle.py "..\authoring\drafts\你的文章文件夹" --mode overwrite
```

发布器会自动生成：

- `content/posts/<slug>.md`

如果 `post.ini` 里是：

```ini
[post]
image_mode = local
```

还会生成：

- `static/images/posts/<slug>/...`

如果 `post.ini` 里是：

```ini
[post]
image_mode = external_repo
image_repo = blog-images-1
```

则图片会进入外部图片仓，本仓库只保留正文 Markdown。

---

## 本地开发和检查

### 预览

推荐从工作区根目录执行：

```powershell
.\scripts\Preview-Site.ps1
```

### 构建检查

推荐：

```powershell
.\scripts\Build-Site.ps1
```

或者在当前目录直接执行：

```powershell
..\tools\hugo\hugo.exe --gc --minify
```

---

## 提交和推送

当前仓库日常推送流程：

```powershell
git status
git add .
git commit -m "Describe your change"
git push origin main
```

如果你只想提交部分文件，也可以显式指定路径：

```powershell
git add content/posts/voice-agent-overview.md layouts/partials/comments.html
```

---

## GitHub Pages 设置

仓库网页里应确认：

- `Settings -> Pages -> Source = GitHub Actions`

推送后在：

- `Actions`

查看 `Build and deploy` 是否成功。

---

## 主题和本地覆盖

当前主题通过 Git 子模块接入：

```powershell
git submodule update --remote themes/loficode
```

如果只是要改页面结构、样式或局部逻辑，优先改：

- `layouts/`
- `static/css/`
- `static/js/`

不要轻易直接改：

- `themes/loficode/`

这样后续升级主题时更容易保持兼容。

---

## 一般不要手工维护的目录

### `public/`

这是 Hugo 构建输出目录，会被重新生成。

### `resources/`

这是 Hugo 资源缓存目录，一般不需要手工维护。

### `themes/loficode/`

这是主题子模块，除非明确要改主题源码，否则优先用本地覆盖。

---

## 当前和工作区根目录的关系

如果你要理解完整工作流，建议先看：

- [../README.md](D:\WorkSpace\Project\KyroBlog\README.md)

如果你要看文章包、图片仓和 `post.ini` 的细节，再看：

- [../authoring/drafts/README.md](D:\WorkSpace\Project\KyroBlog\authoring\drafts\README.md)
- [../authoring/notes/image-repo-upgrade-plan.md](D:\WorkSpace\Project\KyroBlog\authoring\notes\image-repo-upgrade-plan.md)
# Kyro-Qu Blog
