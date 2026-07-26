---
title: "搞机教程"
subtitle: "从备份、解锁 BL 到 Root 的完整入门笔记"
date: 2026-05-19T22:00:00+08:00
draft: false
tags: ["Android"]
featured: false
mood: "focus"
description: "一篇面向新手的安卓搞机流程梳理，涵盖 BL、Fastboot、Recovery、TWRP、Magisk 与 KernelSU。"
image: "/images/og/gadget-tutorial.png"
---
这份笔记按“先备份，再刷机，最后扩展”的顺序整理，尽量把概念和操作主线分开。

如果只想记最核心的一条流程，先记这个：

**备份数据 -> 解锁 BL -> 线刷官方包 -> 确认该修补 `boot.img` 还是 `init_boot.img` -> 用 KernelSU 或 Magisk 修补 -> Fastboot 刷回**

如果后面还要刷 ZIP、做分区备份、装第三方 Recovery，再额外考虑 TWRP。

## 一、先把几个概念讲清楚

### 1. BL（Bootloader）

- BL 可以理解成开机最前面的“门锁”。
- 大多数刷机、刷分区、刷 Root 镜像之前，都要先解锁 BL。
- 解锁 BL 往往会清空数据，所以**备份必须在最前面**。
- 解锁前通常要先打开开发者选项里的 **OEM 解锁** 和 **USB 调试**。

### 2. Fastboot

- Fastboot 是最常见的电脑刷机模式。
- 线刷官方包、刷分区、刷 patched 镜像，基本都离不开它。
- 常见进入方式：**关机后长按 音量下 + 电源键**。

### 3. Recovery

Recovery 可以理解成系统外的一套维护环境，类似电脑上的 PE。

系统自带 Recovery：

- 原厂自带
- 常用于恢复出厂、清缓存、安装部分官方更新

![系统自带 Recovery](https://kyroqu.xyz/blog-images-1/posts/gadget-tutorial/image-20260515181430314.png)

第三方 Recovery：

- 最常见的是 **TWRP**
- 常用于刷 ZIP、清分区、备份分区、恢复系统
- 不同机型分区结构不同，TWRP 必须找**适配当前机型和系统版本**的版本

小米常见进入 Recovery 的方式：

- **音量上 + 电源键**

![进入 Recovery 的常见按键](https://kyroqu.xyz/blog-images-1/posts/gadget-tutorial/image-20260515181600308.png)

### 4. 线刷和卡刷

- **线刷**：手机连电脑刷，常见工具是 Fastboot、MiFlash、柚坛工具箱
- **卡刷**：进入 Recovery 后刷 ZIP，最常见就是用 TWRP 刷

可以直接记成：

- **线刷 = 电脑刷**
- **卡刷 = Recovery 里刷**

### 5. `boot.img` 和 `init_boot.img`

这是现在最容易搞混、也最容易刷错的地方。

- 老一些的设备，Root 修补目标常常是 `boot.img`
- 新一些的设备，尤其是较新的 GKI / A/B 机型，常常要修补 `init_boot.img`

最实用的判断方法不是死背原理，而是看两件事：

1. 你从当前官方固件里实际提取出来的是什么文件
2. KernelSU / Magisk / 机型教程明确要求刷的是哪个分区

结论只有一句：

**修补的是哪个镜像，最后就刷回哪个分区。**

例如：

- 修补的是 `boot.img`，就刷 `boot`
- 修补的是 `init_boot.img`，就刷 `init_boot`

## 二、开始前要准备什么

动手前建议先准备好这些东西：

- 当前手机的重要数据备份
- 已开启开发者选项、OEM 解锁、USB 调试
- 对应机型的官方 ROM
- 与**当前系统版本完全匹配**的原厂 `boot.img` 或 `init_boot.img`
- Root 工具：**KernelSU** 或 **Magisk**
- 电脑端驱动、ADB/Fastboot 环境
- 可用的 TWRP 或第三方 Recovery（只在你确实需要时准备）

这里最重要的原则是：

**你拿来修补和刷入的镜像，必须和当前系统版本匹配。**

## 三、推荐的标准流程

### 1. 先备份

无论你要做的是解 BL、线刷还是 Root，第一步都应该是备份。

### 2. 解锁 BL

常见思路：

1. 打开开发者选项
2. 打开 **OEM 解锁**
3. 打开 **USB 调试**
4. 按机型要求完成 BL 解锁

要记住两件事：

- 解锁 BL 经常会清空数据
- 备份不要只留在手机里，最好复制到电脑

### 3. 先线刷一遍官方包

这样做的目的主要有三个：

- 统一系统状态
- 确保后面提取的镜像和当前系统一致
- 降低修补错镜像、刷错版本的概率

### 4. 再决定要不要刷 TWRP

现在的 TWRP 已经不是“Root 必需品”了。

- 如果你只是想拿 Root，很多时候直接修补 `boot` / `init_boot` 就够了
- 如果你还要刷 ZIP、做分区备份、装模块包、手动救砖，再考虑 TWRP

## 四、Root 的两条路线

### 路线 A：直接修补 `boot` / `init_boot`，这是现在更常用的做法

这是目前最常见、也通常最省事的方式。

常用工具：

- **KernelSU**
- **Magisk**

核心思路很简单：

1. 从当前系统对应的官方包里提取原厂镜像
2. 在手机里用 KernelSU 或 Magisk 修补
3. 得到 patched 镜像
4. 手机进 Fastboot
5. 用 Fastboot 把修补后的镜像刷回对应分区

![修补镜像的基本思路](https://kyroqu.xyz/blog-images-1/posts/gadget-tutorial/image-20260515182003821.png)

#### 1. KernelSU 常见安装方式

常见能见到的方式有四种：

1. 通过自定义 Recovery 安装
2. 通过内核刷写类 App 安装
3. 直接使用现成的 KernelSU 镜像 Fastboot 刷入
4. **手动修补 `boot` / `init_boot` 后再刷回**

其中第 4 种最通用，也最适合自己掌握整个流程。

#### 2. 手动修补的实际顺序

1. 从当前官方固件里提取 `boot.img` 或 `init_boot.img`
2. 把这个镜像传到手机
3. 在 KernelSU App 里选择“修补”
4. 等待输出 patched 镜像
5. 把修补后的镜像传回电脑
6. 手机进入 Fastboot
7. 在电脑终端里把镜像刷回对应分区

KernelSU 修补完成后的界面大致如下：

![KernelSU 修补完成示意](https://kyroqu.xyz/blog-images-1/posts/gadget-tutorial/image-20260515200050029.png)

#### 3. 刷回时最关键的一点

**分区名必须和你修补的文件对应。**

如果你修补的是 `boot.img`：

```bash
fastboot flash boot patched.img
fastboot reboot
```

如果你修补的是 `init_boot.img`：

```bash
fastboot flash init_boot patched.img
fastboot reboot
```

一个实际示例：

```bash
fastboot flash init_boot kernelsu_patched_20260515_115809.img
fastboot reboot
```

#### 4. 为什么这种方式更常用

- 不依赖 TWRP
- 操作链路更短
- 更适合“只想拿 Root，不想折腾太多”的场景

过去常见流程是：

**解锁 BL -> 刷 TWRP -> 卡刷 Magisk**

现在更常见的是：

**解锁 BL -> 提取镜像 -> 修补 -> Fastboot 刷回**

#### 5. 关于 LKM 和 `init_boot`

你在 KernelSU 修补日志里，可能会看到类似：

- `Adding KernelSU LKM`
- `Output file is written to ...`

这里的 **LKM** 指的是可加载内核模块。  
对日常使用来说，不需要把底层实现啃得太细，先记住下面这条就够了：

**新机型很常见的是修补 `init_boot.img`，老机型更常见的是修补 `boot.img`，具体以当前固件和机型教程为准。**

### 路线 B：先刷 TWRP，再在 Recovery 里做 Root

这条路线现在仍然有用，只是已经不再是默认首选。

典型流程：

**解锁 BL -> 刷入或临时启动 TWRP -> 进入 Recovery -> 刷入 Magisk 或其他 ZIP**

更适合这些场景：

- 你要刷第三方 ZIP
- 你要做 Recovery 分区备份
- 你的机型对 TWRP 支持成熟

## 五、TWRP 和小米工具的关系

如果你用的是小米机器，常见的电脑端工具有两类：

- **MiFlash**
- **柚坛工具箱**

### 1. MiFlash：主要用来线刷官方包

常见思路：

1. 下载并解压官方 ROM
2. 在 MiFlash 里选择 ROM 目录
3. 手机进入 Fastboot
4. 执行线刷

要特别注意：

- **不要选会重新上锁的选项**
- 一般就是避免使用 **`clean all and lock`**

![MiFlash 选项示意](https://kyroqu.xyz/blog-images-1/posts/gadget-tutorial/image-20260515182228191.png)

### 2. 柚坛工具箱：适合把常用操作集中起来做

它常见能做的事情包括：

- 解锁相关操作
- 线刷官方包
- 刷入或临时启动 Recovery
- 修补 Boot / Init Boot

例如在线刷官方包时，常见做法是：

1. 先把 ROM 下载并解压好
2. 选择 ROM 目录
3. 执行脚本时选 `flash all`
4. 等待执行完成，成功后一般会自动开机

![柚坛工具箱线刷示意](https://kyroqu.xyz/blog-images-1/posts/gadget-tutorial/image-20260515185040378.png)

如果你要刷入或临时启动 TWRP，柚坛工具箱里也能直接做：

![柚坛工具箱刷入 Recovery 示意](https://kyroqu.xyz/blog-images-1/posts/gadget-tutorial/image-20260515190713987.png)

## 六、Root 后常见扩展

拿到 Root 之后，很多人下一步会装模块环境。

常见组合是：

**ZygiskNext -> LSPosed -> 其他模块**

### 1. ZygiskNext

- 常见用途是给 KernelSU 提供 Zygisk 环境
- 一般从 GitHub 的 Releases 页面下载对应的 `.zip`
- 然后在 KernelSU 或 Magisk 的模块页安装

### 2. LSPosed

- 常见安装包名是 `LSPosed-vxxx-zygisk-release.zip`
- 前提通常是已经有可用的 Zygisk 环境
- 装好后再去启用你真正想用的模块

### 3. HyperCeiler

如果你后面想玩 HyperOS / MIUI 的功能增强类模块，可以再看：

[HyperCeiler](https://hyperceiler.sevtinge.com/)

## 七、备份和迁移怎么选

备份要分成两种情况看：

- **同系统迁移**
- **跨系统迁移**

### 1. 同系统迁移

例如：

- 小米官方包 -> 小米官方包
- 同一套系统里平刷、重刷、换机

这类场景下，**小米自带本地备份通常是首选**，而且很多时候不需要 Root。

本地备份路径通常是：

```text
MIUI/backup/AllBackup/
```

操作路径通常是：

```text
设置 -> 更多设置 -> 备份与恢复 -> 手机备份恢复 -> 第三方应用和数据
```

使用方法：

1. 先在旧手机上完成本地备份
2. 把整个 `AllBackup` 文件夹复制到电脑
3. 刷机或换机完成后，先在新系统里新建一次本地备份，让目录结构自动生成
4. 再把电脑里的 `AllBackup` 文件夹复制回手机覆盖
5. 最后在系统里执行恢复

这种方式的优点是恢复完整度高，很多第三方应用数据都能带回来。

### 2. 跨系统迁移

例如：

- 小米官方包 -> 类原生系统
- 小米官方包 -> 官改包
- 两套不同 Android 定制系统之间迁移

这类场景更适合用：

- **Swift Backup（快翼备份）**
- **Titanium Backup（钛备份）**

但有一条原则绝对不要忘：

**跨系统时，只恢复第三方应用和它们自己的数据，不要恢复系统应用和系统组件。**

不要乱恢复的内容包括：

- 设置
- 系统桌面
- 蓝牙组件
- 系统服务相关数据

否则很容易因为底层配置冲突，导致报错、卡开机，甚至无限重启。

## 八、最容易踩坑的地方

### 1. 解锁 BL、线刷、重刷都可能清空数据

所以备份一定要在最前面，而且最好额外备份到电脑。

### 2. 镜像一定要和当前系统版本匹配

这是 Root 失败、卡启动、无法进系统的高发原因。

### 3. `boot` 和 `init_boot` 不要打错

修补的是哪个镜像，就刷回哪个分区。  
这是现在最常见的人为失误之一。

### 4. 不要随便重新上锁

尤其是在第三方系统、Root 状态、分区内容已经改过的情况下，重新上锁风险很高。

### 5. TWRP 不是万能，也不是必须

- 新机型不一定有成熟 TWRP
- 有些场景直接修补镜像更省事

### 6. 跨系统恢复时，不要碰系统应用数据

这点最容易被忽略，但出问题时通常最麻烦。

## 九、一句话总结

如果你的目标只是“稳一点地拿到 Root”，最实用的主线通常是：

**先备份 -> 解锁 BL -> 线刷当前官方包 -> 提取对应的 `boot.img` 或 `init_boot.img` -> 用 KernelSU 或 Magisk 修补 -> Fastboot 刷回**

如果你后面还要刷 ZIP、做 Recovery 备份、装更多系统级模块，再考虑 TWRP、LSPosed 和其他扩展。
