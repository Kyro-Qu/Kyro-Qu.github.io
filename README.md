# Kyro Blog Site

这个目录是实际要推送到 GitHub 的 Hugo 站点仓库。

上一级工作区里的 `authoring/` 和 `scripts/` 用来做本地写作与管理，不需要一起推送。真正发布到 GitHub Pages 的内容只在这个目录里。

## 首次推送

1. 在 GitHub 上创建仓库 `Kyro.github.io`
2. 进入当前目录后执行：

```powershell
git remote add origin https://github.com/Kyro-Qu/Kyro.github.io.git
git add .
git commit -m "Initialize Hugo blog"
git push -u origin main
```

3. 打开 GitHub 仓库设置页：
   `Settings -> Pages -> Build and deployment -> Source`
4. 选择 `GitHub Actions`

如果保持当前仓库名，站点地址通常会是：
`https://kyro-qu.github.io/Kyro.github.io/`

如果你后续把仓库改名为 `Kyro-Qu.github.io`，站点地址会变成：
`https://kyro-qu.github.io/`

## 本地命令

预览站点：

```powershell
..\tools\hugo\hugo.exe server -D
```

构建静态文件：

```powershell
..\tools\hugo\hugo.exe --gc --minify
```

## 主题更新

当前主题通过 Git 子模块接入：

```powershell
git submodule update --remote themes/loficode
```

更新后记得重新预览并提交变更。
