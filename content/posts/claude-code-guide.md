---
title: "Claude Code CLI 使用指南"
subtitle: "从入门到精通的完整参考手册"
date: 2026-06-12T23:40:00+08:00
draft: false
tags: ["AI"]
featured: false
mood: "focus"
description: "Claude Code CLI 完整使用指南，涵盖基础操作、权限模式、上下文管理、高级功能（Memory、CLAUDE.md、Skills、MCP、SubAgent、Hook）等内容，帮助你快速掌握 Claude Code 的强大功能。"
---
## 目录

- [基础操作](#基础操作)
- [权限模式](#权限模式)
- [上下文管理](#上下文管理)
- [常用命令](#常用命令)
- [文件访问](#文件访问)
- [高级功能](#高级功能)
  - [记忆系统（Memory）](#记忆系统memory)
  - [CLAUDE.md 配置](#claudemd-配置)
  - [Skills 技能扩展](#skills-技能扩展)
  - [MCP（Model Context Protocol）](#mcpmodel-context-protocol)
  - [SubAgent 子代理](#subagent-子代理)
  - [Hook 钩子](#hook-钩子)
- [快捷键](#快捷键)
- [获取帮助](#获取帮助)

---

## 基础操作

### 启动 Claude

1. **切换到工作目录**

```bash
cd D:\WorkSpace\Project\CPA
```

![image-20260612172052042](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612172052042.png)

2. **启动 Claude**

```bash
claude
```

![image-20260612172207508](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612172207508.png)

3. **基本操作**
   - `Enter` - 确认执行
   - `ESC` - 退出/取消

### 查看所有命令

按下斜杠 `/` 可以看到所有可用命令

![image-20260612172336229](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612172336229.png)

### 恢复历史对话

```bash
/resume
```

![image-20260612172740719](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612172740719.png)

---

## 权限模式

使用 `Shift + Tab` 循环切换权限模式：

### 模式说明

| 模式 | 说明 |
|------|------|
| **默认模式** (`?` for shortcuts) | 每次操作都需要点击确定才执行 |
| **Plan Mode** (`plan mode on`) | 不直接执行，先制定计划，用户确认后才执行 |
| **Accept Edits** (`accept edits on`) | 自动接受文件编辑，但执行命令仍需确认 |

### 跳过权限检查（谨慎使用）

```bash
claude --dangerously-skip-permissions
```

> ⚠️ **警告**：此模式会跳过几乎所有权限检查，请仅在完全信任操作时使用。

---

## 上下文管理

### 查看当前上下文

```bash
/context
```

显示当前对话的上下文使用情况

![image-20260612173846676](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612173846676.png)

### 压缩上下文

当完成阶段性任务时，压缩上下文以节省空间：

```bash
/compact
```

> 💡 **建议**：在完成一个功能模块或任务后使用，保留关键信息。

### 清空上下文

完全清空当前对话上下文，重新开始：

```bash
/clear
```

> ⚠️ **注意**：此操作会清除所有历史记录。

### 回滚操作

回滚已修改的文件和对话：

```bash
/rewind
```

> 💡 **用途**：撤销最近的修改，恢复到之前的状态。

---

## 常用命令

### 配置相关

```bash
/config          # 打开配置设置
/fast            # 切换快速模式（Opus 加速输出）
/model           # 选择模型
```

![image-20260612184407471](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612184407471.png)

### 会话管理

```bash
/resume          # 恢复历史对话
/clear           # 清空当前上下文
/compact         # 压缩上下文
/context         # 查看上下文信息
/rewind          # 回滚修改的文件和对话
/btw             # 另外提问（与当前项目上下文隔离，按 ESC 退出）
```

> 💡 **提示**：`/btw` (by the way) 用于临时提问，不会影响当前项目上下文。

### 开发辅助

```bash
/init            # 初始化 CLAUDE.md 文档
/review          # 审查 Pull Request
/code-review     # 代码审查（可加 --comment 或 --fix）
/security-review # 安全审查
/verify          # 验证代码更改
/simplify        # 简化和优化代码
```

### 研究与分析

```bash
/deep-research   # 深度研究（多源事实核查）
```

### 自动化

```bash
/loop            # 循环执行命令（如：/loop 5m /verify）
```

---

## 文件访问

### 读取文件

Claude 会自动使用专用工具读取文件，无需手动操作：

- 直接在对话中提及文件名或路径
- 使用 `@文件名` 引用文件

![image-20260612180036265](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612180036265.png)

**支持图片输入**：可以通过将图片粘贴复制到对话框或者拖拽到对话框

![image-20260612184236725](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612184236725.png)

### 编辑文件

Claude 可以直接编辑文件，根据权限模式决定是否需要确认。

### 搜索文件

```bash
# 在对话中直接请求
"搜索包含 'function' 的所有 .js 文件"
"查找 src 目录下的所有 TypeScript 文件"
```

---

## 高级功能

### 记忆系统（Memory）

Claude Code 具有持久化记忆功能，分为两个层级：

#### 查看和编辑记忆

```bash
/memory
```

#### 记忆层级

| 层级 | 说明 | 存储位置 |
|------|------|----------|
| **全局记忆** | 跨所有项目的通用偏好和设置 | `~\.claude\CLAUDE.md` |
| **项目记忆** | 当前项目特定的上下文和规范 | `<项目路径>\.claude\projects\<项目>\memory\` |

![image-20260612202203873](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612202203873.png)

#### 自动记忆

Claude 会自动记录重要的项目信息和用户偏好：

![image-20260612202536498](https://kyro-qu.github.io/blog-images-1/posts/claude-code-guide/image-20260612202536498.png)

**记忆内容包括**：
- 项目偏好和规范
- 用户反馈和建议
- 项目特定的上下文
- 工作流程和习惯

---

### CLAUDE.md 配置

CLAUDE.md 是 Claude Code 的项目配置文件，分为三个层级：

#### 层级结构

1. **全局配置**
   - 位置：`~\.claude\CLAUDE.md`
   - 用途：跨项目的通用设置

2. **项目级配置**
   - 位置：`<项目根目录>\CLAUDE.md`
   - 用途：项目特定的规范和约定

3. **子文件夹配置**
   - 位置：`<子目录>\CLAUDE.md`
   - 用途：模块或子系统的特定配置

#### 初始化项目配置

```bash
/init
```

> 💡 **最佳实践**：在项目有了基本雏形后再执行 `/init`，这样 Claude 可以更好地理解项目结构。

**配置内容示例**：
- 项目架构和技术栈
- 代码规范和风格指南
- 测试策略
- 部署流程
- 特殊注意事项

---

### Skills 技能扩展

Skills 是 Claude Code 的扩展能力，可以添加自定义功能。

#### 内置 Skills

- `/deep-research` - 深度研究
- `/code-review` - 代码审查
- `/security-review` - 安全审查
- `/verify` - 验证功能
- `/simplify` - 代码简化

#### 自定义 Skills

可以从社区获取更多 Skills：

**示例**：从 Vercel Labs 获取 find-skills

```bash
# 访问 https://github.com/vercel-labs/skills
# 下载并安装自定义 skills
```

> 💡 **提示**：Skills 可以扩展 Claude Code 的功能，适配特定的开发流程。

---

### MCP（Model Context Protocol）

MCP 是 Claude Code 的协议接口，用于与外部工具集成。

#### 支持的 CLI 工具

Claude Code 可以通过 MCP 与多种命令行工具集成：

**硬件开发**：
- ESP-IDF（嵌入式开发）
- Vivado（FPGA 开发）

**科学计算**：
- MATLAB

**协作工具**：
- 飞书（Lark）

**通用工具**：
- OpenCLI

#### 使用场景

- 自动化硬件开发流程
- 集成科学计算工具
- 连接企业协作平台
- 扩展命令行功能

> 💡 **提示**：通过 MCP，Claude 可以直接调用这些工具的命令行接口。

---

### SubAgent 子代理

SubAgent 是 Claude Code 的多代理协作功能，用于处理复杂任务。

#### 查看和管理代理

```bash
/agents
```

#### 代理类型

1. **自动派生**
   - Claude 自动创建子代理处理特定任务
   - 适用于并行任务、多步骤工作流

2. **手动创建**
   - 通过 `/agents` 命令手动创建和管理
   - 适用于长期运行的后台任务

#### 使用场景

- 大规模代码重构
- 并行测试执行
- 多文件同步修改
- 复杂的调试任务

---

### Hook 钩子

Hook 是 Claude Code 的条件执行机制，允许在特定事件触发时自动执行操作。

#### Hook 类型

- **Pre-commit Hook** - 提交前检查
- **Post-edit Hook** - 编辑后操作
- **Pre-run Hook** - 运行前准备
- **Post-test Hook** - 测试后处理

#### 使用场景

- 代码格式化（提交前自动格式化）
- 测试执行（修改后自动运行测试）
- 依赖检查（运行前验证环境）
- 通知发送（任务完成后发送通知）

#### 配置方式

通过 `/update-config` skill 配置 `settings.json`：

```bash
/update-config
```

> 💡 **提示**：Hook 可以实现自动化工作流，减少重复操作。

---

### 工作流 (Workflow)

对于复杂的多步骤任务，可以使用工作流自动化：

- 并行执行多个子任务
- 结构化的任务分解
- 进度跟踪

---

### 技巧与最佳实践

1. **定期压缩上下文**：避免上下文过载
2. **使用适当的权限模式**：根据信任度选择模式
3. **善用 /resume**：快速恢复工作状态
4. **文件引用使用 @**：更精确的文件定位
5. **配合快速模式**：提高响应速度（`/fast`）
6. **利用 /btw 隔离提问**：不影响当前工作上下文
7. **善用 /memory**：记录项目特定的知识
8. **初始化 CLAUDE.md**：让 Claude 更好理解项目
9. **配置 Hook 自动化**：减少重复操作

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 确认/执行 |
| `ESC` | 取消/退出 |
| `Shift + Tab` | 切换权限模式 |
| `/` | 显示命令列表 |
| `?` | 显示快捷键帮助 |

---

## 获取帮助

在任何时候输入 `/help` 或按 `?` 查看可用的快捷键和命令。

更多信息请访问：
- [Claude Code 官方文档](https://claude.ai/code)
- [Vercel Labs Skills](https://github.com/vercel-labs/skills)

---

## 快速参考

### 常用命令速查

| 命令 | 用途 |
|------|------|
| `/resume` | 恢复历史对话 |
| `/btw` | 隔离提问 |
| `/rewind` | 回滚修改 |
| `/model` | 切换模型 |
| `/memory` | 管理记忆 |
| `/init` | 初始化配置 |
| `/agents` | 管理子代理 |
| `/loop` | 循环执行 |

### 工作流程建议

1. **项目初始化**：`cd 项目目录` → `claude` → `/init`
2. **日常开发**：使用 `@文件名` 引用 → 让 Claude 编辑
3. **阶段完成**：`/compact` 压缩上下文
4. **遇到问题**：`/rewind` 回滚或 `/btw` 询问
5. **定期维护**：`/memory` 更新项目知识

