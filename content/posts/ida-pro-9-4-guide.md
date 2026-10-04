---
title: "IDA Pro 9.4 体验与 STM32 固件逆向"
subtitle: "从裸机固件加载到接入 Claude 辅助分析"
date: 2026-10-04T18:00:00+08:00
draft: false
tags: ["逆向工程", "嵌入式"]
featured: false
mood: "focus"
description: "记录 IDA Pro 9.4 逆向体验：以 STM32G431 固件为例，梳理固件加载、SRAM 与外设段配置、SVD 寄存器映射及 F5 反编译流程，并体验官方 IDA MCP 接入 Claude 的全新玩法。"
image: "/images/og/ida-pro-9-4-guide.png"
---
## 简介

**IDA Pro**（全称 **Interactive Disassembler Professional**）是由比利时 Hex-Rays 公司开发的二进制逆向分析与反汇编工具。

软件经典图标是法国路易十四的第二任配偶——曼特农夫人。

![IDA Pro 图标](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004121726655.png)

IDA Pro 常用于 ARM / x86 等架构的反编译，在单片机与嵌入式固件分析、恶意软件与病毒行为逆向、提取特征码、竞品功能拆解还原，以及游戏安全与外挂分析等场景中，都是极其重要的工具。

**Interactive DisAssembler（交互式反汇编）的基本流程**：

二进制文件 $\rightarrow$ 汇编代码 $\rightarrow$ 函数/控制流 $\rightarrow$ 伪代码 $\rightarrow$ 理解程序逻辑

除了商业逆向标准的 IDA Pro，开源领域还有 NSA 推出的 [Ghidra](https://github.com/NationalSecurityAgency/ghidra/releases)。如果用 Ghidra 分析 MCU 固件，可以通过社区的 [SVD-Loader-Ghidra](https://github.com/leveldown-security/SVD-Loader-Ghidra) 插件把厂商提供的 SVD 外设寄存器定义导入进去。

### IDA Pro 常见分析对象

| 文件 / 程序 | 用途说明 |
| :--- | :--- |
| **`.exe`** | Windows 桌面程序逆向 |
| **`.dll`** | 动态链接库分析 |
| **`.elf`** | Linux 应用程序 / 嵌入式程序 |
| **`.so`** | Linux / Android Native 动态库 |
| **`.bin`** | 裸机固件（Raw Binary） |
| **`.hex`** | Intel HEX 单片机固件 |
| **`.axf`** | ARM 嵌入式带调试信息镜像 |
| **Android ELF** | 安卓底层 Native 代码 |
| **Bootloader** | 设备启动引导代码分析 |
| **MCU Firmware** | 各类微控制器固件分析 |

![IDA Pro 支持架构概览](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261003221821994.png)

### 常用核心快捷键

- **`G`**：跳转到指定内存或虚拟地址（Jump to address）
- **`F5`**：一键生成伪 C 代码（反编译）
- **`Space`**：在流程图（Graph View）和文本汇编模式之间切换

---

## 分析 STM32 固件

在嵌入式逆向中，常见需求包括分析单片机固件逻辑、提取固件算法、破解或去除设备 UID 绑定保护等。这里以 **STM32G431** 的 `.hex` 固件为例进行逆向记录。

### 打开工程与处理器配置

打开 IDA 选择待逆向的固件文件：

- 处理器类型选择：`ARM processors` $\rightarrow$ `ARM Little-endian`
- 关键地址参数：
  - 内部 Flash 起始地址：`0x08000000`
  - SRAM 起始地址：`0x20000000`
- **`.bin` 与 `.hex` 的区别**：
  - 纯二进制文件（`.bin`）不包含任何加载地址信息，打开时**必须手动指定** ROM 起始地址（如 `0x08000000`），否则代码跳转地址全会错位；
  - Intel HEX 文件（`.hex`）本身带有地址记录类型（Record Type），记录了数据的物理绝对地址，IDA 会自动识别并将基地址设置为 `0x08000000`。

![选择固件与处理器参数](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261003234345499.png)

- 点击 **Processor options**（处理器选项）：
  - 指定具体核心为 **Cortex-M4**
  - Base architecture：`ARMv7-M`
  - VFP instructions：`VFPv4`
  - Thumb instructions：`Thumb-2`

### 确认加载弹窗

配置完成后点击确定，IDA 会弹出两个确认框：

**提示 1：ARM 与 Thumb 模式切换说明**  
Cortex-M 系列内核只执行 Thumb/Thumb-2 指令，不执行传统 32 位 ARM 指令。IDA 会提示默认反汇编状态，点击 **OK** 即可。

![Thumb 模式切换提示](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/2f9e417d-d1d5-4e79-b1a5-cb9b762c9f14.png)

**提示 2：自动更新与 Lumina 服务器提示**  
IDA 启动时默认会检查更新，并提示是否使用 Lumina 云端服务器辅助识别函数。

![版本检查与 Lumina 弹窗](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261003234519703.png)

**实操处理步骤**：
1. **取消勾选** `Automatically check for new versions`；
2. **取消勾选** `自动使用 Lumina 服务器进行分析(L)`（避免把敏感固件特征上传，也避免因网络连不上导致卡顿）；
3. 点击 **确定** 进入反汇编主工作区。

---

## 工作区速览

### 文件导航槽（Navigation Band）

![文件导航槽](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261003235924109.png)

顶部彩条直观展示了各个区间的大小分布，深蓝色区域表示已被成功识别出来的用户代码，黑色区域通常为未映射或空闲区。

### 函数区（Functions Window）

IDA 自动分析后会在左侧列出所有识别出的函数符号：

```text
start
sub_80001E0
sub_80001F4
sub_80001F6
sub_80001F8
sub_80001FA
sub_80001FC
...
```

![函数窗口](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004000151556.png)

向右拖拽窗口可以展开更多列，双击函数名可快速跳转到对应代码：
- **段 (Segment)**：函数所在内存段
- **起始 (Start)**：入口物理/虚拟地址（十六进制）
- **长度 (Length)**：函数字节大小
- **局部 (Locals)**：局部变量占用的栈空间
- **参数 (Arguments)**：参数占用的栈空间

最后一列的标志位字符含义：

| 标志 | 含义 | 说明 |
| :---: | :--- | :--- |
| **`R`** | 返回函数 | 函数具备正常的返回点（执行返回调用者） |
| **`F`** | 远函数 | 具备跨段调用属性 |
| **`L`** | 库函数 | 命中了已知的标准库/运行时签名（FLIRT 库） |
| **`S`** | 静态函数 | 局部静态作用域函数 |
| **`M`** | 终结函数 | 不返回调用者的函数（如进入死循环或中断终结） |
| **`O`** | 外联代码 | 编译器优化提取的公共代码块 |
| **`B`** | 基于栈帧 | 使用标准栈帧指针（FP/BP），IDA 会自动将偏移转换为局部变量 |
| **`T`** | 具备类型 | 函数已具备明确的原型类型签名信息 |
| **`=`** | 帧指针稳定 | 帧指针等于初始堆栈指针 |
| **`X`** | 异常处理 | 包含异常捕获（Catch 块）或回溯清理代码 |

### 命令输入区与主视图

![命令输入区](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004000835699.png)

底部为 Python / IDC 命令行与输出日志窗口。主工作区包含两个核心视图：
- **十六进制视图**：查看原始十六进制字节；
- **IDA 视图**：交互式汇编窗口，按住 `Ctrl` 滚动鼠标滚轮可以自由缩放控制流图。

![十六进制视图与汇编视图](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004001141700.png)

---

## 配置 SRAM 内存段

由于单片机裸机固件没有操作系统的虚拟内存管理，如果不手动定义 RAM 和外设区间，IDA 的数据流分析引擎在反编译时就无法识别全局变量和外设寄存器的读写，导致代码中出现大量未定义的裸指针。

按快捷键 **`Shift + F7`** 打开段管理界面（Segments），按 **`Insert`** 键新建段：

![新建段对话框](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004155449398.png)

针对 **STM32G431**（32 KB SRAM，Flash 起始 `0x08000000`），需要手动添加以下两个段：

1. **RAM 内存段（SRAM1）**
   - 起始地址：`0x20000000`
   - 结束地址：`0x20008000`（大小 32 KB）
   - 属性：32 位可读可写数据段（`READ | WRITE`）
2. **PERIPH 外设寄存器段**
   - 起始地址：`0x40000000`
   - 结束地址：`0x50040000`（覆盖 APB1/APB2/AHB1/AHB2 外设寄存器，包括 GPIO、TIM、ADC、CORDIC 等）
   - 属性：32 位可读可写数据段（`READ | WRITE`）

![配置完成后的内存段列表](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004155619064.png)

---

## 导入 SVD 外设描述文件

虽然建立了外设段，但寄存器在代码里依然是生硬的绝对物理地址。导入 MCU 厂商提供的 **SVD（System View Description）** 文件后，IDA 就能直接把地址解析成可读的外设结构体与寄存器名（如 `GPIOA`、`RCC`、`USART`、`TIM` 等）。

IDA 9.4 内置了 SVD 导入功能：
- 菜单路径：**编辑 $\rightarrow$ 插件 $\rightarrow$ SVD文件管理**
- 快捷键：**`Ctrl + Shift + F11`**

![SVD 插件管理界面](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004160441258.png)

选择对应芯片的 SVD 文件。已安装 Keil MDK 的环境可以直接从 DFP 芯片包中获取：
```text
E:\Keil_v5\Keil\STM32G4xx_DFP\1.1.0\CMSIS\SVD\STM32G431xx.svd
```

![导入 SVD 成功](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004193829166.png)

导入后，IDA 会自动生成外设寄存器结构体映射。

---

## 反编译伪 C 代码

1. 按 **`G`**（Jump to address），在弹框中输入目标函数地址（例如分析出的主函数入口 `0x08015660`），按回车跳转；
2. 直接按键盘顶部的 **`F5`** 键，重新反编译。

![F5 反编译伪代码效果](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004194725749.png)

有了前面的 SRAM 段和 SVD 外设映射，反编译出来的伪代码不仅变量逻辑清晰，外设操作也直接呈现为具名的寄存器访问，极大降低了阅读成本。

---

## AI 协作：官方 IDA MCP 上手

2026 年 10 月，Hex-Rays 官方推出了 **IDA MCP Server**（[GitHub 官方仓库](https://github.com/HexRaysSA/ida-mcp)），支持 IDA 9.4+，同时支持 GUI 插件联动与 Headless（无头）分析。

### 环境依赖

| 依赖项 | 官方要求 |
| :--- | :--- |
| **IDA 版本** | IDA 9.4 或更高版本 |
| **Python** | Python 3.11 或更高版本 |
| **包管理** | `uv` |
| **版本管理** | `git` |

### 运作机制与架构

官方 IDA MCP 基于 **IDA Nexus** 架构设计，支持两种运行模式：

1. **GUI 联动模式**：在 IDA 中加载 GUI 插件。当我们在 IDA 界面中分析固件时，MCP Server 能实时捕获当前打开的数据库，AI 助手可直接获取反汇编与反编译上下文。
2. **Headless（无头/独立）模式**：直接调用底层的 `idalib` 在后台静默解析并提供分析，完全不需要启动 IDA 的图形界面。

### 安装与配置

#### 步骤 1：安装插件组件

```bash
uvx ida-hcli mcp install
```
> 命令会自动检测本机的 IDA 9.4 路径，并将 `ida-mcp` 部署到插件目录。也可以直接指定仓库安装：`uvx ida-hcli plugin install ida-mcp@https://github.com/HexRaysSA/ida-mcp`。

#### 步骤 2：配置客户端

**配置 Claude Desktop**（在 `%APPDATA%\Claude\claude_desktop_config.json` 中配置）：

```json
{
  "mcpServers": {
    "ida": {
      "command": "uvx",
      "args": ["--exclude-newer=1s", "ida-mcp", "stdio", "--agent=claude-desktop"]
    }
  }
}
```

**配置 Claude Code CLI**：

直接通过官方插件市场安装：

```bash
claude plugin marketplace add HexRaysSA/claude-marketplace
claude plugin install ida-mcp@HexRaysSA
```

安装完成后，在终端即可直接与 IDA MCP 通信：

![Claude Code 终端中集成 IDA MCP](https://kyro-qu.github.io/blog-images-1/posts/ida-pro-9-4-guide/image-20261004151624800.png)

---

## 总结：AI 时代的逆向新体验

以前搞单片机逆向，必须一步步守在 IDA 界面前：手动加载文件、配架构、建 RAM 段、导 SVD，然后一个个函数点过去看汇编和伪代码。

而在 AI 时代，随着 IDA 9.4 官方引入 MCP 以及对 `idalib` 无头模式的原生支持，未来的逆向工作流有了完全不同的可能：

**你甚至不需要每次都打开沉重的 IDA 图形界面，而是直接把 Claude 当作全自动逆向助手。在终端里打开 Claude Code CLI，输入一句：**
> *“帮我分析这个固件的主逻辑，找出按键扫描和 UID 加密算法对应的函数。”*

Claude 就能通过 IDA MCP 在后台自动调用 `idalib` 加载固件、跑反汇编、沿着控制流交叉引用追查，并直接在命令行里把算法还原和拆解结果交代得清清楚楚。从“纯手动点选分析”到“命令行驱动的全自动逆向”，这或许才是 IDA 9.4 带来的最直观的体验升级。
