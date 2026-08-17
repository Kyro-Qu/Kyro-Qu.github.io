---
title: "CAN 总线通信"
subtitle: "从物理层、协议层到 CAN FD、CANopen 与 STM32 实战"
date: 2026-08-18T01:02:59+08:00
draft: false
tags: ["FOC"]
featured: false
mood: "focus"
description: "系统梳理 CAN/CAN FD 总线物理层差分电平、节点组成、仲裁机制、报文帧格式、CANopen 协议体系及基于 STM32G431 的 FDCAN 调试与实战案例。"
image: "/images/og/can-bus.png"
---
# CAN总线

## 目录

- [简介](#简介)
  - [CAN](#can)
  - [ECU](#ecu)
  - [CAN 总线简史](#can-总线简史)
  - [CiA 组织](#cia-组织)
- [物理层](#物理层)
  - [线路](#线路)
  - [节点组成](#节点组成)
  - [收发器](#收发器)
  - [线与关系](#线与关系)
  - [仲裁](#仲裁)
  - [终端电阻](#终端电阻)
- [协议层](#协议层)
  - [CAN 总线特点](#can-总线特点)
  - [OSI 模型](#osi-模型)
  - [CAN 帧](#can-帧can-frame)
- [CAN FD](#can-fd)
- [MIT 协议](#mit-协议)
- [CANopen](#canopen)
- [编程应用](#编程应用)
- [其它总线](#其它总线)
- [应用案例](#应用案例)
  - [车载平板与 Home Assistant 联动](#车载平板与-home-assistant-联动)
  - [第三方设备破解特斯拉 FSD 功能](#第三方设备破解特斯拉-fsd-功能)
  - [雅迪电动车一体控制器 CAN 通信采样](#雅迪电动车一体控制器-can-通信采样)

![image-20260813191118619](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260813191118619.png)

## 简介

### CAN

Controller Area Network，控制器局域网，由德国Bosch（博世）公司开发，是一种高可靠性、易扩展的串行通信总线，广泛应用于汽车、工业控制等领域，支持多主控架构下的高效通信。

![Bosch Logo and symbol, meaning, history, PNG, brand](https://kyro-qu.github.io/blog-images-1/posts/can-bus/bosch-logo.png)

一个 CAN 网络可以有很多节点。

![image-20260813202334795](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260813202334795.png)

CAN总线是实现通信的神经系统。

ECU（又名“CAN 节点”）就像身体的一部分，通过 CAN 总线互连。一个部分感知到的信息可以与另一部分共享。

### ECU

ECU（Electronic Control Unit，电子控制单元）。

电子控制单元（ECU）是用于控制特定功能的组件，例如发动机、变速箱、制动、转向和温度控制等。一辆现代汽车可以拥有 70 多个 ECU，每个 ECU 都会与总线上的其他 ECU 共享信息。

目前常见的 ECU 包括：

- ABS（防抱死系统）
- EBD（制动力分配系统）
- EMS（引擎管理系统）
- 多功能数字仪表
- 主动悬架
- 导航娱乐系统
- 电子防盗系统
- 自动空调
- ...

### CAN 总线简史

CAN 总线的发展史在很大程度上反映了车载网络从诞生到普及的过程。

1. 1983年，BOSCH开始着手开发CAN总线；
2. 1986年，在SAE会议上，CAN总线正式发布；
3. 1987年，Intel和Philips推出第一款CAN控制器芯片；
4. 1991年，奔驰500E是世界上第一款基于CAN总线系统的量产车型；
5. 1991年，Bosch发布CAN 2.0标准，分CAN 2.0A（11位标识符，标准帧）和CAN 2.0B（29位标识符，扩展帧）；
6. 1993年，ISO发布CAN总线标准（ISO 11898），随后该标准主要有三部分：
   - ISO 11898-1：数据链路层协议
   - ISO 11898-2：高速CAN总线物理层协议
   - ISO 11898-3：低速CAN总线物理层协议

### CiA 组织

1992 年，一些公司创建了非营利组织 CAN in Automation（CiA），用于提供与 CAN 相关的技术、产品和市场信息。该组织旨在提升 CAN 的影响力，并为 CAN 协议的后续发展铺平道路。截至 2020 年年初，已有 670 家公司加入 CiA 组织。

通用设备配置文件：

- CiA 401 系列：I/O 设备的 CANopen 配置文件
- CiA 402 系列：用于驱动和运动控制的设备配置文件
- CiA 404 系列：用于测量设备和闭环控制器的 CANopen 设备配置文件
- CiA 406 系列：编码器的设备配置文件
- CiA 408 系列：流体动力技术的设备配置文件
- CiA 410 系列：倾斜仪的设备配置文件
- CiA 418：电池模块的 CANopen 设备配置文件
- CiA 419：电池充电器的 CANopen 设备配置文件
- CiA 442：适用于 IEC 61915-2 兼容电机启动器的 CANopen 设备配置文件
- CiA 445：RFID 设备的 CANopen 配置文件
- CiA 446：用于 AS-i 网关的 CANopen 设备配置文件
- CiA 450：泵的 CANopen 设备配置文件
- CiA 452：用于 PLCopen 运动控制的 CANopen 设备配置文件
- CiA 453：电源的 CANopen 设备配置文件
- CiA 458：用于能源测量的 CANopen 设备配置文件
- CiA 459 系列：用于车载称重设备的 CANopen 配置文件
- CiA 460 系列：用于服务机器人控制系统的 CANopen 配置文件
- CiA 461 系列：用于称重设备的 CANopen 配置文件
- CiA 462：用于物品检测设备的 CANopen 配置文件

https://www.can-cia.org/can-knowledge/generic-device-profiles

## 物理层

- 波特率：节点必须通过两线总线连接，波特率高达 1 Mbit/s（经典 CAN）或 8 Mbit/s（CAN FD）
- 电缆长度：最大 CAN 电缆长度应介于 500 米 (125 kbit/s) 和 40 米 (1 Mbit/s) 之间
- 端接：CAN 总线必须在总线的每一端使用 120 欧姆端接电阻器进行端接

### 线路

CAN 总线采用双绞线传输差分信号，具有较强的抗共模干扰能力。

![twisted-can-bus-wiring-harness-high-low-green-yellow](https://kyro-qu.github.io/blog-images-1/posts/can-bus/twisted-can-bus-wiring-harness-high-low-green-yellow-1786619161217-7.svg)

双绞线组成的两线总线分别为 CAN_H 和 CAN_L。

电线通常采用颜色编码：CAN_H 为黄色，CAN_L 为绿色。

### 节点组成

一个 CAN 节点的硬件通常由 CAN 控制器和 CAN 收发器组成。CAN 控制器负责 CAN 总线的逻辑控制，实现 CAN 传输协议；CAN 收发器主要负责 MCU 逻辑电平与 CAN 总线电平之间的转换。

![ecu-electronic-control-unit-can-bus-node](https://kyro-qu.github.io/blog-images-1/posts/can-bus/ecu-electronic-control-unit-can-bus-node.svg)

微控制器：MCU 是 ECU 的核心。

CAN 控制器：控制器通常集成在 MCU 中，确保所有通信都遵循 CAN 协议（消息编码、错误检测、仲裁等）

CAN 收发器：CAN 收发器将 CAN 控制器连接到物理 CAN 线路，将控制器数据转换为 CAN 总线系统的差分信号。

### 收发器

大部分 MCU 集成了 CAN 控制器；CAN 收发器主要负责将 MCU 的 TTL 电平（CAN_RX 与 CAN_TX）转换为 CAN 差分电平。

![image-20260814102555045](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814102555045.png)

#### CAN 收发芯片

| 芯片               | 厂商             | Classical CAN | CAN FD 快速阶段  | 厂商保证最高速率 | 主要特点 / 备注                                              |
| ------------------ | ---------------- | ------------- | ---------------- | ---------------- | ------------------------------------------------------------ |
| **TJA1050**        | NXP              | ✅             | ❌ 未针对 FD 保证 | **1 Mbit/s**     | 经典高速 CAN 收发器；ISO 11898；无 Standby；**NXP 已标记 EOL** ([NXP](https://www.nxp.com/products/interfaces/can-transceivers/legacy-can/high-speed-can-transceiver%3ATJA1050)) |
| **TJA1042**        | NXP              | ✅             | ✅                | **5 Mbit/s**     | 当前数据手册明确符合 ISO 11898-2:2016，CAN FD fast phase 时序保证到 5 Mbit/s；带 Standby/总线唤醒 ([NXP](https://www.nxp.com/docs/en/data-sheet/TJA1042.pdf)) |
| **TJA1051**        | NXP              | ✅             | ✅                | **5 Mbit/s**     | TJA1050 的后续增强型；CAN FD fast phase 保证到 5 Mbit/s；有 Silent mode，但不像 TJA1042 那样主打 Standby 总线唤醒 ([NXP](https://www.nxp.com/docs/en/data-sheet/TJA1051.pdf)) |
| **SIT1050T**       | 芯力特 SIT       | ✅             | ❌ 未针对 FD 保证 | **1 Mbit/s**     | 定位类似 TJA1050 的经典高速 CAN 收发器；官方数据手册标题明确为 1 Mbps High Speed CAN Transceiver ([Sitcores](https://en.sitcores.com/uploadfile/2024/0219/20240219103101958.pdf?utm_source=chatgpt.com)) |
| **SIT1042T / T/3** | 芯力特 SIT       | ✅             | ✅                | **5 Mbit/s**     | 官方资料明确支持 5 Mbps CAN FD；T/3 带 VIO，可兼容 3.3 V/5 V MCU 逻辑 ([Sitcores](https://www.sitcores.com/show-13-155-1.html?utm_source=chatgpt.com)) |
| **MCP2542FD**      | Microchip        | ✅             | ✅                | **8 Mbit/s**     | 官方明确支持 CAN 2.0 + CAN FD，针对 **2/5/8 Mbps** 优化；本表高速能力最高 ([Microchip](https://ww1.microchip.com/downloads/aemDocuments/documents/APID/ProductDocuments/DataSheets/MCP2542FD-MCP2542WFD-4WFD-Data-Sheet-DS20005514C.pdf)) |
| **NCA1044-Q1**     | NOVOSENSE 纳芯微 | ✅             | ✅                | **5 Mbit/s**     | 车规 CAN FD 收发器；ISO 11898-2 系列，Standby + Wake-up；AEC-Q100 Grade 1 ([Nexty](https://e-nexty.dxp.nexty-ele.com/product_files/download?lc_code=ja&maker_code=NOVOSENSE&product_file_id=5972268&product_id=6325220&product_part_number=NCA1044-Q1DNR&search_log_id=9906461&utm_source=chatgpt.com)) |



#### 差分电平

![image-20260814102313070](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814102313070.png)

CAN总线定义了两种逻辑电平状态：

**高速CAN**

显性电平（Dominant）- 逻辑"0"

- CAN_H ≈ 3.5V
- CAN_L ≈ 1.5V
- 差分电压 Vdiff = CAN_H - CAN_L ≈ 2V

隐性电平（Recessive）- 逻辑"1"

- CAN_H ≈ 2.5V
- CAN_L ≈ 2.5V
- 差分电压 Vdiff = CAN_H - CAN_L ≈ 0V

![image-20260813211733691](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260813211733691.png)

**高速CAN信号电平**

![822b6317-0815-4820-9b9e-79fbecf87670](https://kyro-qu.github.io/blog-images-1/posts/can-bus/822b6317-0815-4820-9b9e-79fbecf87670.png)



**低速CAN信号电平**

定义CANH和CANL

电压相差5V（CANH = 0V, CANL = 5V）时为逻辑"1"，

电压相差2.2V（CANH = 3.6V, CANL = 1.4V）时为逻辑"0"。

差分电压=低电平=逻辑0=显性电平

![2c96f3c0-cf4f-4348-9a10-bb45e3d668ee](https://kyro-qu.github.io/blog-images-1/posts/can-bus/2c96f3c0-cf4f-4348-9a10-bb45e3d668ee.png)

### 线与关系

CAN 总线满足线与逻辑：只要任一设备输出 **0**，总线即为 **0**；只有所有设备都输出 **1** 时，总线才为 **1**。

| A    | B    | BUS  |
| ---- | ---- | ---- |
| 1    | 1    | 1    |
| 1    | 0    | 0    |
| 0    | 1    | 0    |
| 0    | 0    | 0    |

开漏（OD，Open Drain）输出在不附加上拉电阻时不具备输出高电平的能力，是实现线与逻辑的一种方式。

![b327cc9e-e154-4f76-9c24-7e0fefc59381](https://kyro-qu.github.io/blog-images-1/posts/can-bus/b327cc9e-e154-4f76-9c24-7e0fefc59381.png)

| 总线状态       | CAN_H  | CAN_L  | 差分 (CAN_H-CAN_L) | 逻辑  |
| -------------- | ------ | ------ | ------------------ | ----- |
| 隐性 Recessive | ≈2.5 V | ≈2.5 V | ≈0 V               | **1** |
| 显性 Dominant  | ≈3.5 V | ≈1.5 V | ≈2 V               | **0** |

假设 CAN 总线上有三个节点：

| A    | B    | C    | 总线实际结果 |
| ---- | ---- | ---- | ------------ |
| 1    | 1    | 1    | **1**        |
| 0    | 1    | 1    | **0**        |
| 1    | 0    | 1    | **0**        |
| 1    | 1    | 0    | **0**        |
| 0    | 0    | 1    | **0**        |
| 0    | 0    | 0    | **0**        |

Bus = A ∧ B ∧ C：CAN 总线上只要有节点发送 0，总线就是 0；必须所有节点都发送 1，总线才是 1。

CAN 总线在默认空闲时为 1（隐性）。当任一节点要发送消息时，总线会变为 0（显性）。

当某个节点真正想开始发送一帧 CAN 消息时，它首先发送一个：**0 —— SOF（Start Of Frame，帧起始位）**

因此：

- 只要任一控制器激活，总线即被激活。
- 所有控制器关闭时，总线处于未激活的隐性状态（1）。

### 仲裁

CAN ID 越小，优先级越高。

假设三个节点同时发送：从 ID 的最高位开始，一位一位发送并比较。

![image-20260814183545153](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814183545153.png)

### 终端电阻

CAN 总线两端使用 120 欧姆终端电阻进行阻抗匹配，以减少信号反射。

总线两端的设备各放置一个 120 欧姆终端电阻。存在分支时，应选择最远的两个节点端接，并使其他节点的分支尽量短。

低速 CAN 属于开环总线，高速 CAN 属于闭环总线。

**低速CAN**

![image-20260814110755494](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814110755494.png)

**高速CAN**

![image-20260814110709037](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814110709037.png)

## 协议层

CAN 协议是串行数据通信的 ISO 标准 (ISO 11898)。该协议是针对汽车应用而开发的。如今，CAN 已得到广泛应用，用于工业自动化以及汽车和移动机器。

CAN 总线是一种串行数据通信协议。

串行通信是指数据按位依次传输，每一位数据占据固定的时间长度，适用于强调近距离通信和实时性的场景。



### CAN 总线特点

- 符合OSI开放式通信系统参考模型；
- 可以多主方式工作。网络未阻塞时，任一节点均可主动向网络上的其他节点发送消息，通信方式灵活；
- 采用无破坏性的基于优先级的逐位仲裁，标识符越小，优先级越高。若两个节点同时向网络上传输数据，优先级高的报文获得总线访问权，优先级低的报文会在下一个总线周期自动重发；
- 消息报文不包含源地址或者目标地址，仅通过标识符表明消息功能和优先级；
- 基于固定消息格式的广播式总线系统，短帧结构；
- 在线缆长度为 40 米的条件下，最高数据传输速率为 1 Mbps；
- 节点数实际可达110个；
- 事件触发型，只有当有消息要发送时，节点才向总线上广播消息；
- 可以通过发送远程帧请求其它节点发送数据；
- 消息数据长度为 0~8 Byte；
- 具备错误检测功能。所有节点均可检测错误，检测到错误的节点会立即通知其他节点；
- 发送消息出错后，节点会自动重发；
- 故障限制，节点控制器可以判断错误是暂时的数据错误还是持续性错误，当总线上发生持续数据错误时，控制器可将节点从总线上隔离；
- 通信介质可采用双绞线、同轴电缆和光纤，一般使用成本最低的双绞线。

典型通信速率与距离如下：

低速 CAN（ISO 11519）通信速率为 10~125 Kbps，总线长度可达 1000 米。

高速 CAN（ISO 11898）通信速率为 125 Kbps~1 Mbps，总线长度不超过 40 米。

CAN FD 通信速率可达 5 Mbps，并兼容经典 CAN，遵循 ISO 11898-1 进行数据收发。

- 在最高速率1Mbps下，通信距离可达40米。
- 在较低速率125kbps下，通信距离可达500米。
- 在最低速率10kbps下，通信距离可达1000米。

### OSI 模型

开放式系统互联通信参考模型（Open System Interconnection Reference Model，OSI）。

- OSI参考模型是一个逻辑上的定义，一个规范，它把网络从逻辑上分为七层，每一层都对应着不同的作用，这七层分别为应用层、表示层、会话层、传输层、网络层、数据链路层、物理层。
- OSI参考模型的七层协议的分层目的是为了解决异种机互连的问题，包括互连时所遇到的兼容性问题。分层的最大优点是将服务、接口和协议这三者明确地区分开。

![fab54a09-0d3a-4e38-8576-e4178a8325ad](https://kyro-qu.github.io/blog-images-1/posts/can-bus/fab54a09-0d3a-4e38-8576-e4178a8325ad.png)

**1. 物理层：**

物理层是OSI的第一层，该层作为七层网络中的最低层，是整个网络通信的基础。物理层为设备之间的数据通信提供传输媒体及互连设备，为数据传输提供可靠的环境。它的主要功能是为数据端设备提供传送数据的通路。

物理层的媒体包括架空明线、平衡电缆、光纤、无线信道等。

**2. 数据链路层：**

OSI模型的第二层，它控制网络层与物理层之间的通信。它的主要功能是如何在不可靠的物理线路上进行数据的可靠传递。为了保证传输，从网络层接收到的数据被分割成待定的可被物理层传输的帧。

**3. 网络层：**

OSI模型的第三层，是为传输层提供服务的，传送的协议数据单元成为数据包或分组。该层的主要作用是解决如何使数据包通过各节点传送的问题，即通过路径选择算法，将数据包送到目的地。另外，为避免通信子网中出现过多的数据包而造成的网络阻塞，需要对流入的数据包数量进行控制。当数据包要跨越多个通信子网才能到达目的地的时候，还要解决网际互联的问题。

**4. 传输层：**

该层的任务主要是负责节点间的数据传输和控制功能。传输协议同时进行流量控制或是基于接收方可接收数据的快慢程度规定适当的发送速率。当这一层中，它可以对网络所能处理的最大尺寸进行分割，使得有效传输，例如，以太网不能传输超过1500个字节的数据包，对于长字节的数据，传输层将会对数据分割成较小的数据片，并且对分割后的片标上序号，进行排序，最终实现无差错传输。传输层是OSI中承上启下层，下三层面向网络，确保信息准确传输；上三层面向用户主机，为用户提供各种服务。传输层与使用的网络无关。

**5. 会话层：**

该层的主要目的是组织和同步在两个通信的会话用户之间的对话，对管理数据的交换。该层功能是在网络中的两个节点之间进行建立和维持通信。因此在该层中，需要链接节点间的通信，在两节点间对话中要实行同步对话，同时需要确定何时中断，以及中断后如何进行重新发送。

**6. 表示层：**

主要用于处理在两个通信系统中的交互信息的表示方式。它包括数据的格式变换、数据加密与解密、数据压缩与恢复等功能。

**7. 应用层：**

应用层是OSI的最后一层，它为OSI模型以外的应用程序提供服务。应用层中包含大量的、人们普遍需要的协议。该层提供的服务包括文件传输、文件管理以及电子邮件的信息处理。

#### 常见的 CAN 应用层协议

CAN 总线通信接口包含 CAN 协议的物理层和数据链路层功能；上层协议则是在 CAN 标准基础上定义的应用层，市场上存在多种应用层标准。

| 名称         | 波特率                                    | 规格                             | 适用领域                     |
| ------------ | ----------------------------------------- | -------------------------------- | ---------------------------- |
| SAE J1939-11 | 250k                                      | 双线式、屏蔽双绞线               | 卡车、大客车                 |
| SAE J1939-12 | 250k                                      | 双线式、屏蔽双绞线、12V供电      | 农用机械                     |
| SAE J2284    | 500k                                      | 双线式、双绞线(非屏蔽)           | 汽车（高速：动力、传动系统） |
| SAE J24111   | 33.3k、83.3k                              | 单线式                           | 汽车（低速：车身系统）       |
| NMEA-2000    | 62.5k、125k、250k、500k、1M               | 双线式、屏蔽双绞线供电           | 船舶                         |
| DeviceNet    | 125k、250k、500k                          | 双线式、屏蔽双绞线24V供电        | 工业设备                     |
| CANopen      | 10k、20k、50k、125k、250k、500k、800k、1M | 双线式、双绞线可选（屏蔽、供电） | 工业设备                     |
| SDS          | 125k、250k、500k、1M                      | 双线式、屏蔽双绞线可选（供电）   | 工业设备                     |

### CAN 帧（CAN frame）

11 位标识符的标准 CAN 数据帧（CAN 2.0A）：

![image-20260813204741470](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260813204741470.png)

- SOF：帧开始位为“显性 0”，用于通知其他节点有节点准备通信；
- ID：帧标识符，数值越小，优先级越高；
- RTR：远程传输请求，指示该帧是数据帧还是向其他节点请求数据的远程帧；
- 控制：包含标识符扩展位（IDE）和 4 位数据长度代码（DLC）。DLC 指定要传输的数据字节数，范围为 0~8；
- 数据：数据字段包含数据字节，即有效负载，其中包括可解码的 CAN 信号；
- CRC：循环冗余校验，用于确保数据完整性；
- ACK：ACK 槽用于指示节点是否已正确接收数据；
- EOF：标记 CAN 帧结束。

标准 CAN 帧：

![37f817f8-b8d4-45cb-8e47-d26e122045bd](https://kyro-qu.github.io/blog-images-1/posts/can-bus/37f817f8-b8d4-45cb-8e47-d26e122045bd.png)

#### 重要参数

其他参数通常由 CAN 转换器自动处理，例如 CRC 计算和数据打包。

CAN ID：设备的身份标识。在 CAN 2.0A（标准帧）中，ID 为 11 位，范围为 0~2047；在 CAN 2.0B（扩展帧）中，ID 为 29 位，范围为 0~536870911。仲裁时，ID 数值越小，优先级越高，可优先获得总线进行数据传输。

DLC：数据长度。经典 CAN 最大为 8 字节、速率最高为 1 Mbps；CAN FD 最大为 64 字节、速率最高可达 8 Mbps。

DATA：需要发送的数据。根据 DLC 指定的数据长度，发送对应长度的数据。

通信速率：确认通信使用的波特率。

#### 仲裁

CAN总线采用非破坏性仲裁机制，通过比较消息标识符的优先级来决定哪个节点有权继续发送数据。这种机制确保了总线上数据传输的有序性，避免了冲突。

CAN 仲裁方法使每个 CAN 节点只需处理与自身相关的消息。

CAN 总线的核心通信机制，用于解决多节点同时发送数据的总线冲突问题。当多个 ECU 同时向总线发报文时，会通过逐位比对 CAN ID 来判定优先级，ID 数值小的报文可继续发送，ID 大的则主动退出发送，等待下一次总线空闲，保证了总线通信的有序性和实时性。

#### ACK（应答）

CAN 报文的确认机制，位于报文的 ACK 段。当接收节点正确接收到完整报文后，会向总线发送一个显性电平作为应答，告知发送节点"数据已成功接收"；若发送节点未收到应答，则判定传输失败并会重发报文，保证了通信的可靠性。

## CAN FD

CAN FD 的仲裁段速率与经典 CAN 一致，最高为 1 Mbps；数据段中，经典 CAN 最大支持 1 Mbps、8 字节，而 CAN FD 最大支持 12 Mbps、64 字节。

CAN FD 支持可变波特率，数据负载可达 64 B。

FDCAN 需要硬件支持，例如很多 STM32G4、H7 等系列里能看到 FDCAN 外设。

| **特性**           | **CAN 2.0 (Classic CAN)**             | **CAN FD (ISO 11898-1)**                |
| ------------------ | ------------------------------------- | --------------------------------------- |
| **最大波特率**     | 1 Mbps                                | 仲裁段 $\le$ 1 Mbps / 数据段 2 ~ 8 Mbps |
| **最大数据长度**   | 8 字节                                | 64 字节                                 |
| **有效载荷利用率** | 约 30% ~ 50%                          | 可达 80% 以上                           |
| **CRC 校验位数**   | 15 位                                 | 17 位 / 21 位（带 Stuff Count）         |
| **向后兼容性**     | 无法解析 CAN FD 帧（会报 Form Error） | CAN FD 节点通常完全向下兼容 CAN 2.0 帧  |

## MIT 协议

MIT Control Mode（MIT 控制模式）是一种常用于机器人关节控制的协议格式。

CAN 控制帧格式

![aff94f20-1be9-4207-921c-b4787af566b5](https://kyro-qu.github.io/blog-images-1/posts/can-bus/aff94f20-1be9-4207-921c-b4787af566b5.png)

该控制帧包含以下参数：

*   p_des：位置给定（单位：rad）
*   v_des：速度给定（单位：rad/s）
*   Kp：位置比例系数
*   Kd：速度比例系数
*   t_ff：前馈转矩给定值（单位：N·M） 

MIT 控制框图：

![image-20260814005801647](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814005801647.png)

## CANopen

### 简介

CANopen 是一种架构在控制器局域网（Controller Area Network，CAN）上的高层通信协议，包括通信子协议和设备子协议。它常用于嵌入式系统，也是工业控制中常用的现场总线。

- CAL（CAN Application Layer）协议是目前基于CAN的高层通讯协议中的一种，最早由Philips医疗设备部门制定。

- CAL 提供了网络管理服务和报文传送协议，但没有定义通信对象的内容或通信对象的类型，即只定义了 how，没有定义 what。这正是 CANopen 的切入点。

- CANopen 在 CAL 基础上开发，使用了 CAL 通信和服务协议子集，为分布式控制系统提供了一种实现方案。CANopen 是 CAN 的一种应用层协议。

- CANopen 的核心概念是设备对象字典（OD，Object Dictionary）。其他现场总线系统，如 Profibus、Interbus-S，也使用这种设备描述形式。

- 注意：对象字典不是 CAL 的一部分，而是在 CANopen 中实现的。

- CANopen 协议免许可证，任何组织和个人都可以开发支持 CANopen 协议的设备，无需支付版税。

![img](https://kyro-qu.github.io/blog-images-1/posts/can-bus/cdee131e-8f7e-47f2-a3a9-bde3b06d1438.png)

### 报文

CANopen 规定了 CAN ID 和 Data 字节分别应该表示什么。

COB：Communication Object 通信对象



CANopen 将所有通信分为多种“通信对象”：

- PDO = Process Data Object 过程数据对象

- SDO = Service Data Object 服务数据对象

- EMCY = Emergency Object 紧急对象

**COB-ID**

 ![image-20260814195100070](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814195100070.png)

### 对象字典（OD）

Object Dictionary（对象字典）可以将一个 CANopen 设备理解为拥有一张巨大的参数表：

```c
┌────────┬──────────┬──────────────────┐
│ Index  │ SubIndex │ 含义             │
├────────┼──────────┼──────────────────┤
│ 0x1000 │ 0x00     │ Device Type      │
│ 0x1001 │ 0x00     │ Error Register   │
│ 0x1017 │ 0x00     │ Heartbeat Time   │
│ 0x6040 │ 0x00     │ Controlword      │
│ 0x6041 │ 0x00     │ Statusword       │
│ 0x6060 │ 0x00     │ Operation Mode   │
│ 0x6064 │ 0x00     │ Actual Position  │
│ 0x606C │ 0x00     │ Actual Velocity  │
│ 0x607A │ 0x00     │ Target Position  │
└────────┴──────────┴──────────────────┘
```

### SDO

SDO 属于服务数据，有指定被接收节点的地址（Node-ID），并且需要指定的接收节点回应 CAN 报文来确认已经接收，如果超时没有确认，则发送节点将会重新发送原报文。

### PDO

PDO 属于过程数据，即单向传输，无需接收节点回应CAN 报文来确认，从通讯术语上来说是属于“生产消费”模型。



## 编程应用

### CAN-To-USB



**Cangaroo** 

Cangaroo 是一款开源的 CAN 协议分析上位机软件。

https://github.com/HubertD/cangaroo

选择 `Measurement > Start Measurement`，或按 `F5`，进入配置页面。

![image-20260814211008915](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814211008915.png)



选择模块所在端口并设置通信协议参数，完成后点击“OK”。

![image-20260814211509545](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814211509545.png)

| 参数                    | 你图中的值                 | 含义                               |
| ----------------------- | -------------------------- | ---------------------------------- |
| Driver                  | CANable SLCAN              | 使用 CANable 的 SLCAN 驱动/协议    |
| Interface               | COM21                      | CANable 在 Windows 上对应的串口    |
| Interface Details       | CANable with CANFD support | 这个适配器支持 CAN FD              |
| **Bitrate**             | 500000                     | **CAN 仲裁阶段波特率**，500 kbit/s |
| Sample Point            | 87.5%                      | 普通 CAN 位时间中的采样位置        |
| **CanFD Bitrate**       | 2000000                    | **CAN FD 数据阶段** 2 Mbit/s       |
| CanFD SamplePoint       | 未选                       | CAN FD 高速数据阶段的采样位置      |
| configured by OS        | 未勾选                     | 是否由操作系统提前配置 CAN 参数    |
| Listen only mode        | 未勾选                     | 只监听，不主动影响 CAN 总线        |
| One-Shot mode           | 灰色                       | 发送失败后不自动重发               |
| Triple Sampling         | 灰色                       | 每个位采样三次以增强抗干扰         |
| Auto-Restart on bus off | 未勾选                     | Bus-Off 后是否自动恢复             |

在“Address”中设置 CAN ID，在“DLC”中设置数据长度，再填写需要发送的字节数据。

点击“Send”可单次发送数据；点击“Send Repeat”可连续发送数据。

![image-20260814215636879](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814215636879.png)

由于 CAN 是半双工通信，单个 USB 转 CAN 设备不能进行回环测试；不要将 CAN_H 与 CAN_L 直接连接在一起。

### STM32 CAN 通信

STM32G431

![image-20260814223211440](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814223211440.png)

| 信号名称 | 引脚 | 功能        | 说明                     |
| -------- | ---- | ----------- | ------------------------ |
| CAN_TX   | PB9  | FDCAN1 发送 | CAN 总线数据发送         |
| CAN_RX   | PA11 | FDCAN1 接收 | CAN 总线数据接收         |
| CAN_SHD  | PC11 | 收发器控制  | 控制 CAN 收发器启停/休眠 |

CubeMX 配置：

![image-20260817154443332](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260817154443332.png)



**FDCAN 三种模式：**

| Frame Format            | 用途                         |
| ----------------------- | ---------------------------- |
| **Classic mode**        | 普通 CAN / CAN 2.0           |
| **FD mode without BRS** | CAN FD，但整个帧使用同一速率 |
| **FD mode with BRS**    | CAN FD，数据段切换到更高速度 |

CAN/CAN FD 的一个 bit 由 `Sync_Seg + TimeSeg1 + TimeSeg2` 组成：`1 + 13 + 3 = 17 TQ`。

Nominal Time Quantum = 117.647 ns

17×117.647ns≈2000ns

`1 / 2000 ns = 500 kbit/s`，因此**仲裁波特率 = 500 kbps**。

FDCAN Kernel Clock = 170 MHz：

`TQdata = 5 / 170 MHz ≈ 29.412 ns`。

17×29.412ns≈500ns

数据波特率为 `1 / 500 ns = 2 Mbps`。



配置参数为：

| 参数                | 当前值         |
| ------------------- | -------------- |
| FDCAN Kernel Clock  | 约 **170 MHz** |
| 仲裁波特率 Nominal  | **500 kbps**   |
| 数据波特率 Data     | **2 Mbps**     |
| CAN FD              | ✅              |
| BRS                 | ✅              |
| Nominal Prescaler   | 20             |
| Data Prescaler      | 5              |
| Nominal Seg1 / Seg2 | 13 / 3         |
| Data Seg1 / Seg2    | 13 / 3         |
| SJW                 | 3              |
| 标准 ID Filter      | 1 个           |
| 扩展 ID Filter      | 0 个           |





接收和发送数据均通过：

![image-20260817153854069](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260817153854069.png)







## 其它总线

RS485：RS485 是一种差分串行通信物理层标准，通常采用半双工、多点总线连接方式。它具有传输距离远、抗干扰能力强和成本较低等特点，常用于工业仪表、PLC 和变频器等设备之间的通信。RS485 仅规定电气特性，实际通信协议通常采用 Modbus RTU 等上层协议。

LIN：LIN 总线相比 CAN 具有成本优势，采用单主多从结构，更适合用于车窗、座椅、空调和雨刷等对实时性要求较低的车身设备。LIN 常作为 CAN 网络的补充，由网关或主控制器与 CAN 总线连接。

EtherCAT：EtherCAT 是一种基于以太网的工业实时通信总线，具有通信周期短、同步精度高和节点数量扩展方便等特点。它常用于伺服驱动、机器人和运动控制等场景；与 CANopen 相比，EtherCAT 更适合高带宽、高同步要求的多轴控制系统。



https://www.csselectronics.com/pages/can-bus-simple-intro-tutorial?utm_source=chatgpt.com

TI — Controller Area Network Physical Layer Requirements

https://www.ti.com/lit/pdf/slla270?utm_source=chatgpt.com



## 应用案例

### 车载平板与 Home Assistant 联动

给一加平板刷入车载模式后，可通过 CAN to USB 与车辆通信，正常获取车速、导航、发动机参数、转向参数、倒车雷达和全景影像等信息。平板可将数据转发给 Home Assistant，从而通过小布助手语音控制空调、车窗等设备；同时，平板也可以向多功能仪表盘推送媒体信息和导航信息。

### 第三方设备破解特斯拉 FSD 功能

最近出现了一种新生意：通过物理硬件破解特斯拉 FSD 在中国内地未开放的功能，再以“每小时 100 元”或“全天 333 元”的价格对外出租。

该类破解通常依赖第三方 CAN 总线接入设备。设备接入车辆控制器局域网后，可能向车机发送伪造的授权信号，从而绕过官方的地理围栏和软件限制。这类硬件售价约 500 欧元（约合 3973 元人民币），随后有人在此基础上发展出租赁模式，在闲鱼等平台公开出租破解后的 FSD 使用权限。

![e4e18dd9-620a-42fc-9565-b51955357298](https://kyro-qu.github.io/blog-images-1/posts/can-bus/e4e18dd9-620a-42fc-9565-b51955357298.jpg)

![3171e043-c98a-42de-bf13-1708743605cb](https://kyro-qu.github.io/blog-images-1/posts/can-bus/3171e043-c98a-42de-bf13-1708743605cb.jpg)



### 雅迪电动车一体控制器 CAN 通信采样

雅迪电动车一体控制器采用 CAN 通信进行数据采样。

![image-20260814095002067](https://kyro-qu.github.io/blog-images-1/posts/can-bus/image-20260814095002067.png)
