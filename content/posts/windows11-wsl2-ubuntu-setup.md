---
title: "Windows 11 安装 WSL2 Ubuntu"
subtitle: "从开启虚拟化到安装 Ubuntu 的完整记录"
date: 2026-05-19T22:20:00+08:00
draft: false
tags: ["WSL2", "Windows 11", "Ubuntu", "Linux"]
featured: false
mood: "focus"
description: "记录 Windows 11 上启用虚拟化、安装 WSL2、部署 Ubuntu 以及常见注意事项。"
---
参考链接：
https://learn.microsoft.com/zh-cn/windows/wsl/

## wsl2 简介

Windows Subsystem for Linux（简称WSL）是一个在Windows 10\11上能够运行原生Linux二进制可执行文件（ELF格式）的兼容层。它是由微软与 Canonical公司合作开发，其目标是使纯正的Ubuntu、Debian等映像能下载和解压到用户的本地计算机，并且映像内的工具和实用工具能在此 子系统上原生运行。

适用于 Linux 的 Windows 子系统（WSL）是 Windows 的一项功能，可用于在 Windows 计算机上运行 Linux 环境，而无需单独的虚拟机或双重启动。 WSL 旨在为想要同时使用 Windows和 Linux 的开发人员提供无缝高效的体验。

使用 WSL 安装和运行各种 Linux 分发版，例如 Ubuntu、Debian、Kali 等。安装 Linux 分使用 WSL 安装和运行各种 Linux 分发版，例如 Ubuntu、Debian、Kali 等。安装 Linux 分发版 并从 Microsoft 应用商店接收自动更新，导入 Microsoft 应用商店中不可用的 Linux 分发版，或 生成自己的自定义 Linux 分发版。

- 1.将文件存储在独立的 Linux 文件系统中，特定于已安装的分发版。
- 2.运行命令行工具，例如 BASH。
- 3.运行常见的 BASH 命令行工具，例如 grep，sedawk 或其他 ELF-64 二进制文件。
- 4.运行 Bash 脚本和 GNU/Linux 命令行应用程序，包括：
- 5.工具：vim、emacs、tmux
- 6.语言： NodeJS、JavaScript、 Python、Ruby、C/C++、C# & F#、Rust、Go 等。
- 7.服务：SSHD、 MySQL、Apache、lighttpd、 MongoDB、 PostgreSQL。
- 8.使用自己的 GNU/Linux 分发包管理器安装其他软件。
- 9.使用类似 Unix 的命令行 shell 调用 Windows 应用程序。
- 10.在 Windows 上调用 GNU/Linux 应用程序。
- 11.运行直接集成到 Windows 桌面的 GNU/Linux 图形应用程序
- 12.使用设备 GPU 加速 Linux 上运行的机器学习工作负载。

## window11 电脑安装 wsl2

**注意：wsl占用的是我们的C盘空间（10G左右），大家需要注意一下自己的C盘空间**

### 开启虚拟化

#### bios 开启虚拟化支持

确认是否开启

![image-20251118001215726](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118001215726.png)



在安装 wsl2 之前，需要在 bios 界面开启虚拟化的支持。进入 bios 界面的方法是在重启的情况下长按“F2”键。我们安装上述操作进入 bios界面，找到“虚拟化技术”并打开，完成上述操作后，保存设置并重启电脑

注：不同电脑进入 bios 界面的方式可能会不一样，在百度上查找对应的方法即可

#### windows 启用 wsl 和虚拟化功能。

 window 系统中开启 wsl 和虚拟化功能的使用，其具体操作如下图：

![image-20251117234809308](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251117234809308.png)

![image-20251117234756416](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251117234756416.png)

从 VMWare Workstation/Player 15.5.5 版本开始，彻底解决了 VMWare Workstation/Player 与 Hyper-V 的冲突问题。

### 安装 wsl2

进入终端输入指令按下win+r ，输入cmd,回车就可以进入终端指令行

在 windows11 上打开“命令行提示符”，并输入“wsl --set-default-version 2”

```shell
wsl --set-default-version 2           👈设置WSL 版本为 2 （推荐）
wsl --set-default-version 1           👈设置WSL 版本为 1 
```

接下来，继续输入“wsl --update”：

```shell
wsl --update
```

![image-20251118004455483](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118004455483.png)

当出现如上图输出时，说明 wsl2 安装成功。

### 安装 ubuntu

#### **在线安装** 

安装 ubuntu 可以在“Microsoft store”中下载，我们在“Microsoft store”的搜索栏输入“ubuntu”,如下图：

![image-20251117235657356](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251117235657356.png)

这里选择一个自己喜欢的 ubuntu 版本下载即可，我这里下载的是“Ubuntu 20.04.6 LTS”。

**安装22.04版本的**

![image-20251117235748153](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251117235748153.png)



下载完毕后，我们点击“Ubuntu 22.04.6 LTS”进入 ubuntu 系统，如下图：

![image-20251118005127347](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118005127347.png)





#### **离线安装** 

下载离线包进行解压 

![image-20251118000312679](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118000312679.png)



#### 账号和密码

**安装的时候需要输入Linux系统的用户名和密码**  

**提示：密码输入的时候是看不见的，别搞太复杂的密码！**

用户名规则：必须以**小写字母**开头，只能包含：**小写字母、数字、下划线、横杠****不能使用大写字母**

![image-20251118000324506](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118000324506.png)



WSL2：Windows11下的WSL2已经支持和VM共存，配置完后可以直接调用GPU（训练的话大概有百分之十几的性能损失），可以使用Docker，可以和CLion等IDE远程调用环境，甚至可以连接USB设备



# 二、wsl2 ubuntu 访问 U 盘设备

usbipd 是一个用于管理 USB/IP 服务的命令行工具，主要作用是在 Windows 系统上共享 USB设备，使其能够通过网络被其他计算机访问。USB/IP 是一种协议，允许通过网络共享 USB 设备。通过 usbipd 工具，用户可以将本地连接的 USB 设备共享给其他计算机，包括 Hyper-V 虚拟机和WSL 2（Windows Subsystem for Linux 2）。

## 安装 usbipd

### win安装

1.github 获取安装包安装：下载，usbipd 位 于https://github.com/dorssel/usbipd-win/releases，双击 usbipd-win_4.3.0 安装

![image-20251118021940295](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118021940295.png)

2.命令包安装：windows中打开powershell使用以下命令来安装usbipd工具：

```powershell
winget install --interactive --exact dorssel.usbipd-win
```

点击“install”安装，如下图：

![img](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/v2-2ed1bd5bed26bd7e890374538f3179731440w.jpg)

安装完成后，我们重启 windows 电脑，并再次启动 WSL2。

wsl2添加了对usb的支持，至少是截至**2025年5月25**以后，都不再需要重新构建wsl内核了，于是我们只需要在windows端安装usbipd，同时在wsl端安装usbip即可

### wsl安装

```powershell
# 安装当前/未来自动匹配的版本
sudo apt install linux-tools-generic hwdata
sudo update-alternatives --install /usr/local/bin/usbip usbip /usr/lib/linux-tools/*-generic/usbip 20

# 安装固定 5.4.0-77
sudo apt install linux-tools-5.4.0-77-generic hwdata
sudo update-alternatives --install /usr/local/bin/usbip usbip /usr/lib/linux-tools/5.4.0-77-generic/usbip 20
```



#### 更新内核

由于 wsl2 默认使用的 linux 内核不支持访问 usb 存储设备，这就导致了即使 wsl2 成功地映射了 usb 存储设备，也会无法访问。这里我们就需要更新 wsl2 ubuntu 所使用的 linux 内核。



### 配置USB设备共享

https://learn.microsoft.com/zh-cn/windows/wsl/connect-usb

```powershell
usbipd list  			# 在管理员权限的PowerShell中执行,这将显示所有已连接的USB设备及其总线ID（BUSID）。

# 绑定设备
usbipd bind --busid <busid>
usbipd bind --busid 2-3				  # 例如,绑定后该设备将无法被Windows直接使用。
usbipd attach --wsl --busid <busid>	    # 在普通PowerShell中执行：
lsusb	   							# 在WSL终端中验证设备是否可见，如果看到目标设备，说明附加成功。

usbipd attach --wsl --busid 2-2
# 根据设备类型，可能需要进行额外配置：
# 串口设备
sudo chmod 666 /dev/ttyUSB0
# 存储设备：
sudo mkdir /mnt/usb
sudo mount /dev/sdb1 /mnt/usb
r'r'r'r'r
# 断开设备连接
usbipd detach --busid <busid>		# 从WSL中分离：
# 物理断开 USB 设备，才能在 Windows 里使用这个 USB 设备（这个是微软推荐的做法）。或者粗暴点，直接把设备拔了，重新插一下，效果也一样。
usbipd detach --busid 2-2

usbipd unbind --busid <busid>		# 解除绑定（可选）
```









usbipd bind --busid 2-1	运行命令后，再次使用命令 usbipd list 验证设备是否已共享。（后面的设备状态变成 *Shared*）

![alt text](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/o240425025628image.png)

然后就可以附加 USB 设备了（注意，只要 USB 设备连接到 WSL，Windows 将无法使用它）。使用命令 `usbipd attach --wsl -b 2-1` 附加 USB 设备，附加到 WSL2 后，WSL2 运行的分发版本（也就是你 WSL 安装的 linux 系统，我的是 Ubuntu ）可以使用 USB 设备。 使用 `usbipd list` 验证设备是否已附加。



**脚本处理**

USB_wsl_v1.2.bat

```bat

@echo off
setlocal enabledelayedexpansion

:main
cls
echo USB/IP Device Manager
echo --------------------------
echo.

usbipd list
echo.

set /p busid=Enter the BUSID you want to manage: 
usbipd bind -b %busid%
:menu
cls
echo USB/IP Device Manager - BUSID !busid!
echo --------------------------
echo 1. Attach to WSL
echo 2. Detach from WSL
echo 3. Exit
echo.

choice /c 123 /n /m "Select operation: "
if errorlevel 3 goto exit
if errorlevel 2 goto detach
if errorlevel 1 goto attach

:attach
usbipd attach -b %busid% --wsl
pause
goto menu

:detach
usbipd detach -b %busid%
pause
goto menu

:exit
usbipd unbind -b %busid%
goto :eof
```



![image-20251118023850842](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118023850842.png)

这里我们需要绑定的设备是“USB 大容量存储设备”（U 盘、读卡器对应的都是“USB 大容量存储设备”），其对应的“BUSID”是“4-2”，我们输入“4-2”并回车，执行结果如下图

![image-20251118024631128](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118024631128.png)

这里我们需要“绑定 wsl”,我们输入“1”并回车，执行结果如下图：

![image-20251118024644305](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118024644305.png)

当出现如上图输出时，wsl2 ubuntu 绑定 usb 设备成功，我们进入 wsl2 ubuntu 命令行输入 lsusb,结果如下图：

![image-20251118024700283](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118024700283.png)

ubuntu 解除访问 usb 设备

我们进入刚刚执行的“USB_wsl_v1.2”的终端。由于这里我们需要“解绑 wsl”,所以我们输入“2”，现象如下图：

![image-20251118024722227](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118024722227.png)

要重启不然

usbipd: error: The service is currently not running; a reboot should fix that.



WSL-USB-GUI，专门为WSL客户机提供USBIPD的图形操作界面。安装后的运行界面如图，非常简单直观。



https://github.com/featherbear/wsl-usb-gui







```powershell
# 关闭所有正在运行的WSL实例
wsl --shutdown


# 导出指定的发行版到D盘
wsl --export Ubuntu-22.04 D:\Ubuntu_2204.tar


# 导出指定的发行版到D盘
wsl --export Ubuntu-22.04 D:\Ubuntu_2204.tar
```



# 三、将已安装的系统转移到指定盘符

WSL的默认文件存储位置（通常位于系统盘C:\Users\<用户名>\AppData\Local\Packages\<发行版包名>\LocalState\rootfs），Linux发行版及其数据文件（如/home目录下的用户数据）会随使用逐渐膨胀，占用大量空间。通过迁移至其他磁盘（如D盘或外接硬盘），可有效释放系统盘压力。



本文档描述了如何将一个已安装的WSL (Windows Subsystem for Linux) 发行版（例如 `Ubuntu-22.04`）从默认安装位置迁移到另一个磁盘驱动器（例如 `E:` 盘）。

### 1、关闭并导出Linux子系统

首先，为确保数据一致性，建议先关闭正在运行的WSL实例。然后，将需要迁移的Linux发行版导出为一个 `.tar` 文件。

```powershell
# 关闭所有正在运行的WSL实例
wsl --shutdown

# 导出指定的发行版到D盘
wsl --export Ubuntu-22.04 D:\Ubuntu_2204.tar
```

### 2、注销现有Linux子系统

导出成功后，注销当前的Linux子系统。**请注意：此操作会删除原有的虚拟磁盘文件，务必确认已成功导出备份。**

```powershell
wsl --unregister Ubuntu-22.04
```

### 3、导入并安装到新位置

将之前导出的 `.tar` 文件导入到新的指定位置。

```powershell
# 将D盘的tar包导入到 E:\WSL2\Ubuntu-22.04 目录下
# --version 2 参数指定使用WSL 2
wsl --import Ubuntu-22.04 E:\WSL2\Ubuntu-22.04\ D:\Ubuntu_2204.tar --version 2
```

### 4、设置默认登录用户

新导入的系统默认使用 `root` 用户登录。若要恢复为原来的用户，需修改 `wsl.conf` 配置文件。

首先，启动新的发行版。

```powershell
wsl -d Ubuntu-22.04
```

然后，在WSL终端中，编辑或创建 `/etc/wsl.conf` 文件。

```bash
sudo vim /etc/wsl.conf
```

在文件中添加以下内容，将 `your_user_name` 替换为你的实际用户名。

```yaml
[boot]
systemd=true
// 以下添加部分
[user]
default = your_user_name

```

### 5、设置root用户密码

如果需要为 `root` 用户设置一个固定的密码，可以在WSL终端中执行以下命令：

```bash
sudo passwd root
```

### 6、重启WSL

为了使所有配置（尤其是默认用户设置）生效，需要再次关闭WSL。

```powershell
# 在Windows PowerShell或CMD中执行
wsl --shutdown
```

此后，当你通过 `wsl` 或 `wsl -d Ubuntu-22.04` 启动时，系统将默认使用你指定的用户登录。

# 四、修改默认发行版系统

当系统中安装了多个Linux发行版时，可以指定其中一个作为默认发行版。默认发行版会在运行 `wsl.exe` 而不带任何参数时启动。

### 1、查看所有已安装的发行版

使用 `wsl -l -v` 命令可以列出所有已安装的子系统及其状态和版本。星号 `*` 表示当前的默认发行版。

```bash
C:\> wsl -l -v
  NAME              STATE           VERSION
* Ubuntu-22.04      Stopped         2
  docker-desktop    Running         2
```

### 2、设置新的默认发行版

使用 `wsl -s <发行版名称>` 或 `wsl --setdefault <发行版名称>` 命令来设置新的默认发行版。

```bash
# 将 docker-desktop 设置为默认发行版
C:\> wsl -s docker-desktop
操作成功完成。

# 再次查看，确认默认发行版已更改
C:\> wsl -l -v
  NAME              STATE           VERSION
* docker-desktop    Running         2
  Ubuntu-22.04      Stopped         2
```





# 其它

## 命令

```powershell
wsl --list --verbose		    # 查看当前默认分发版
wsl --set-default <名称>		   # 设置默认子系统
wsl --unregister <名称>		   # 注销并删除子系统
wsl --set-default-version 2		   # 设置默认版本：
wsl --update	   					# 更新版本：
wsl --version	 			  # 验证是否安装成功：

wsl --install -d Ubuntu		  #安装指定的版本
wsl -l -v		 			 #查看安装的版本信息
wsl --shutdown		  		#关闭 wsl

wsl.exe --set-version Ubuntu-20.04 2		   # 设置 Ubuntu-20.04 为 WSL 2
wsl.exe --set-version Ubuntu-20.04 1		   # 设置为 WSL 1

wsl --export Ubuntu-22.04 D:\Ubuntu-22.04.tar		   # 导出（备份）WSL 子系统（需要先停止 WSL 子系统）
wsl --unregister Ubuntu-22.04		   # 卸载 WSL 子系统
wsl --import Ubuntu-22.04 D:\WSL D:\Ubuntu-22.04.tar		   # 导入（还原）WSL 子系统
# D:\WSL是导入路径，D:\Ubuntu-22.04.tar是前面备份子系统的路径。
还原后的子系统一般默认是root用户，需要修改为其它用户。只要修改还原后的 Linux 子系统中的/etc/wsl.conf配置文件即可，如下：
nano /etc/wsl.conf
[user]
default=用户名


WSL2 挂载 U 盘
sudo mkdir /mnt/e

```











## WSL2 挂载 U 盘

U盘插入电脑后，WSL并不会识别出 U盘 ，如果想要在 WSL2 中使用或查看 U 盘文件，需要挂载 USB 设备。

首先建一个用来挂载 USB 设备里文件的文件夹：

```
sudo mkdir /mnt/e
```

挂载（Windows 里显示 USB 设备为哪个盘，就将 E 换成对应的字母）：

```
sudo mount -t drvfs E: /mnt/e
```

现在就可以在 WSL 里访问 USB 设备里的内容了。

当想要卸载驱动器以便可以安全地将其删除时：

```
sudo umount /mnt/e
```

这样就恢复到原来 WSL 不识别 USB 设备的状态了。



## 启动 wsl

在 cmd 或者 powershell 内输入 wsl 命令即可：

![在这里插入图片描述](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/41af3839dc154cf29086ebeb10376138.png)

左侧设置，右测打开

![image-20251118021229772](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118021229772.png)

## 文件交互

### Windows 上操作 Linux

在 Windows 文件资源管理器左侧可以找到 Linux 的标志，点击 Linux 就可以操作 Linux 文件。

![在这里插入图片描述](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/6eda3fe8a2d84a7d90620e90dff9d88b.png)

### Linux 操作 Windows 文件

Windows 下的所有文件都被挂载在了 `/mnt` 下，在Windows 终端中的任意目录下输入 wsl，即可进入 Linux 对应的路径。

![在这里插入图片描述](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/53f386e4f849471580c939730f02a893.png)



## 卸载

**注销系统**

cmd

```powershell
wsl -l -v
wsl --unregister Ubuntu-20.04
```

**卸载系统安装软件**

![请添加图片描述](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/2213131753ab51a2f259db0cdb2594bf.png)

## **VSCODE** 

**安装插件WSL**

![image-20251118033945692](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118033945692.png)

![image-20251118033952038](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118033952038.png)

显示系统版本则证明加载成功

![image-20251118034014649](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118034014649.png)



**VSCODE 设置工作目录**

所有的代码编写都在工作目录下：

![image-20251118034035559](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118034035559.png)

![image-20251118034039415](https://kyro-qu.github.io/blog-images-1/posts/windows11-wsl2-ubuntu-setup/image-20251118034039415.png)

/mnt是我们的共享文件夹，与我们的电脑磁盘是绑定的
