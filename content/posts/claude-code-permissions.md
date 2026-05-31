---
title: "Claude Code 更高权限设置"
subtitle: "不用反复点确认的权限配置指南"
date: 2026-05-23T12:00:00+08:00
draft: false
tags: ["AI"]
featured: false
mood: "focus"
description: "Claude Code 四种权限模式详解及 Bypass Permissions 模式的开启步骤。"
---
这篇笔记记录 Claude Code 的权限模式差异，以及如何开启更高权限模式，减少反复确认带来的中断。

> 风险提示：`Bypass permissions` 会允许 Claude Code 自动编辑文件并执行终端命令。只建议在你明确了解当前工作区、命令风险和 Git 状态时短时间使用；不要在陌生仓库、含密钥/生产配置的目录、远程服务器或未备份的重要项目里直接开启。需要更稳妥时，优先使用 `Plan mode`、`Ask permissions` 或 `Accept edits`。

## 权限模式（Mode）

![image-20260523005541789](https://kyro-qu.github.io/blog-images-1/posts/claude-code-permissions/image-20260523005541789.png)

| **模式 (Mode)**        | **检索/读取代码** | **编辑/写入文件** | **执行终端命令** | **安全级别** |
| ---------------------- | ----------------- | ----------------- | ---------------- | ------------ |
| **Plan mode**          | ✅ 自动            | ❌ 禁止            | ❌ 禁止           | 最高（只读） |
| **Ask permissions**    | ✅ 自动            | ⚠️ 每次需确认      | ⚠️ 每次需确认     | 高（安全）   |
| **Accept edits**       | ✅ 自动            | ✅ 自动通过        | ⚠️ 每次需确认     | 中（高效）   |
| **Bypass permissions** | ✅ 自动            | ✅ 自动通过        | ✅ 自动通过       | 最低（危险） |

## 设置步骤

### **打开设置**： 

Claude 桌面应用的主界面，点击左下角或右上角的 **Profile（个人头像/名字）**，然后选择 **Settings（设置）**。

![image-20260523005813904](https://kyro-qu.github.io/blog-images-1/posts/claude-code-permissions/image-20260523005813904.png)

### **找到选项卡**：

在设置窗口的侧边栏中，点击进入 **Claude Code** 选项。

#### **开启开关**：

在这个页面中，找到名为 **Allow bypass permissions mode**（允许绕过权限模式）的开关，并将其 **勾选开启**。

![image-20260523005719777](https://kyro-qu.github.io/blog-images-1/posts/claude-code-permissions/image-20260523005719777.png)

#### **完成**：

关闭设置页面，回到你的代码窗口。此时再去点击那个 Mode 菜单，底下的 `Bypass permissions` 就已经高亮可以选择了。

![image-20260523005836779](https://kyro-qu.github.io/blog-images-1/posts/claude-code-permissions/image-20260523005836779.png)
