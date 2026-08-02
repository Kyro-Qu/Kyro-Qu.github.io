---
title: "电流采集"
subtitle: "STM32G431 三电阻低边采样与电流重构"
date: 2026-08-02T15:35:30+08:00
draft: false
tags: ["FOC"]
featured: false
mood: "focus"
description: "围绕 STM32G431 三电阻低边采样，整理模拟前端、片内 OPAMP、ADC 同步触发、量程计算和 SVPWM 电流重构。"
image: "/images/og/foc-current-sensing.png"
---
> 本篇以 STM32G431、三电阻低边采样、双 ADC 同步采样和 SVPWM 电流重构为主线，整理从模拟前端到 ADC、定时器触发和软件重构的完整链路。

## 目录

- [1. 基本概念](#1-基本概念)
- [2. 常见电流检测方案](#2-常见电流检测方案)
- [3. 低边采样原理与硬件同步](#3-低边采样原理与硬件同步)
  - [3.1 低边采样原理](#31-低边采样原理)
  - [3.2 有效采样窗口](#32-有效采样窗口)
  - [3.3 定时器与 ADC 硬件同步](#33-定时器与-adc-硬件同步)
- [4. 模拟前端与 OPAMP](#4-模拟前端与-opamp)
  - [4.1 信号调理与电流换算公式](#41-信号调理与电流换算公式)
  - [4.2 STM32G431 片内 OPAMP / PGA](#42-stm32g431-片内-opamp--pga)
  - [4.3 CubeMX 中的 OPAMP 配置](#43-cubemx-中的-opamp-配置)
  - [4.4 本项目硬件参数与有效增益](#44-本项目硬件参数与有效增益)
  - [4.5 三相 OPAMP 与 ADC 路径](#45-三相-opamp-与-adc-路径)
- [5. ADC 数据格式与电流换算](#5-adc-数据格式与电流换算)
  - [5.1 ADC 对齐方式](#51-adc-对齐方式)
  - [5.2 浮点与定点（Q 格式）](#52-浮点与定点q-格式)
  - [5.3 电流换算系数](#53-电流换算系数)
  - [5.4 采集量程核算](#54-采集量程核算)
  - [5.5 零点偏置校准](#55-零点偏置校准)
- [6. 项目定时器与 ADC 配置](#6-项目定时器与-adc-配置)
  - [6.1 TIM1 基本参数](#61-tim1-基本参数)
  - [6.2 PWM 通道与 CH4 触发](#62-pwm-通道与-ch4-触发)
  - [6.3 TRGO 触发链路](#63-trgo-触发链路)
  - [6.4 ADC 注入组与 JSQR](#64-adc-注入组与-jsqr)
  - [6.5 ADC 中断处理流程](#65-adc-中断处理流程)
- [7. 软件电流重构](#7-软件电流重构)
  - [7.1 占空比盲区](#71-占空比盲区)
  - [7.2 按 SVPWM 扇区选择采样相](#72-按-svpwm-扇区选择采样相)
  - [7.3 采样与重构策略](#73-采样与重构策略)
  - [7.4 工程实现要点](#74-工程实现要点)
- [8. 参考资料](#8-参考资料)

---

## 1. 基本概念

在 BLDC 或 PMSM 的磁场定向控制（FOC）中，常见的三环级联结构为：

~~~text
位置环 → 速度环 → 电流环（力矩环）
~~~

- 速度环、位置环的反馈量来自编码器或无感观测器。
- 最内层电流环的反馈量来自实时采集的电机相电流。

电流环的基本流程是：

1. 采集电机相电流 $I_a、I_b、I_c$。
2. 星形连接且无中性线引出时，由基尔霍夫电流定律 $I_a+I_b+I_c=0$，两相即可重构第三相：$I_c=-I_a-I_b$。
3. 通过 Clarke 变换得到 $I_\alpha、I_\beta$。
4. 结合转子电角度 $\theta$，通过 Park 变换得到 $I_d$（励磁）和 $I_q$（转矩）。
5. 将 $I_d、I_q$ 与目标电流比较，经 PI 控制输出 $V_d、V_q$，再由 SVPWM 生成驱动波形。

![FOC框图](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260708193445062.png)

---

## 2. 常见电流检测方案

![三种电流检测方案的采样电阻位置](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260708220120899.png)

额定功率低于几千瓦的应用中，常见方案如下。

### 2.1 直接相电流检测（In-line）

- 在逆变器输出端与电机相线之间放置电流传感器，直接测量相电流。
- **优点：** 可在整个 PWM 周期持续测量实际相电流。
- **缺点：** 共模电压变化剧烈，需要高共模抑制比器件，成本较高。

### 2.2 低边桥臂检测（Low-side）

- 在三相逆变器下桥臂（MOSFET 与 GND 之间）放置分流电阻。
- **原理：** 共模电压接近地，可使用低成本分流电阻和运放；但必须在对应下管导通时采样，并与 PWM 严格同步。
- **要求：** 至少检测两桥臂电流才能还原三相信息，三电阻采样最完整。

### 2.3 直流母线单电阻检测（Single-shunt）

- 在直流母线负极放置一个分流电阻。
- **原理：** 根据逆变器开关状态，将母线电流映射到具体相电流。
- **优点：** BOM 更省，家电与汽车应用中较常见。
- **缺点：** 算法复杂，对 ADC 速度要求高；在扇区边界和低调制度下，有效矢量时间过短，通常需要移相或脉冲注入补偿。

本文后续以**三电阻低边采样**为主。

---

## 3. 低边采样原理与硬件同步

### 3.1 低边采样原理

采样电阻位于低边 MOSFET 与 GND 之间。只有当对应相的下管导通、相电流流经该电阻时，该相采样结果才有效。

当三相下管全部导通、逆变器处于 $V_0(000)$ 时，绕组电流仍会经下管和采样电阻续流（Freewheeling），因此可以在零矢量期间测量相电流。

### 3.2 有效采样窗口

采样点不能贴近开关沿。一次可靠采样至少需要满足：

$$
t_{window} > t_{deadtime} + t_{settling} + t_{ADC} + t_{margin}
$$

| 符号 | 含义 |
|---|---|
| $t_{deadtime}$ | 死区时间 |
| $t_{settling}$ | MOSFET 开关振铃及运放建立时间 |
| $t_{ADC}$ | ADC 采样保持时间 |
| $t_{margin}$ | 设计裕量 |

若某相下管导通窗口小于上述总时间，本周期该相采样值就不可信。

### 3.3 定时器与 ADC 硬件同步

ADC 应在有效导通窗口内部、尽量远离两侧开关沿处采样，以避开开关振铃。典型同步方式如下。

1. **中心对齐模式（三角波计数）**
   - 定时器从 0 计到 ARR，再从 ARR 减到 0，产生对称 PWM，把零矢量 $V_0、V_7$ 分布在周期两端与中点附近。

2. **定时器核心寄存器**
   - **ARR：** 决定 PWM 周期和频率。
   - **CCR1/2/3：** 接收 SVPWM 占空比；CNT 等于 CCR 时对应通道发生比较事件。

3. **使用空闲通道 CCR4 触发 ADC**
   - 用 CCR4 比较事件生成 TRGO，硬件触发 ADC 注入组转换，不依赖软件中断发起采样。

4. **定位 $V_0$ 中心**
   - **模式 A（高电平导通上管，CNT 小于 CCR 输出高）：** CNT 等于 ARR 附近输出全低，$V_0$ 中心在 ARR 附近（常见）。
   - **模式 B（低电平导通上管，CNT 小于 CCR 输出低）：** $V_0$ 中心在 0 附近。

5. **前置补偿 ADC 延迟**
   - 以 $V_0$ 中心在 ARR 为例，ADC 触发、采样保持和模拟前端建立都有延迟，不能简单地在正中心才发起触发。
   - 可配置 CCR4 等于 ARR 减去 n，提前 n 个定时器计数触发。n 应根据 ADC 延迟、采样时间和模拟前端建立时间计算，并用示波器实测确认，不能固定照搬为 1。
   - 中心对齐模式下，CNT 等于 CCR4 在上数、下数阶段各发生一次。应使用 OC4REF 的单一边沿，或结合方向位/重复计数器，保证每个 PWM 周期只启动一次采样。

---

## 4. 模拟前端与 OPAMP

### 4.1 信号调理与电流换算公式

低边采样电阻上的原始信号很小，且相电流是双极性的。MCU 的 ADC 通常只能采集 $0\sim3.3\,\mathrm{V}$ 正电压，因此需要在送入 ADC 前进行放大并加入直流偏置：

1. **放大：** 将毫伏级压降放大到 ADC 可有效分辨的范围。
2. **加直流偏置：** 将零电流点抬到固定电压（如 $1.5\sim2.0\,\mathrm{V}$），使 ADC 能同时表示正、负电流。

信号链路：

$$
I_{phase} \rightarrow V_{shunt} \rightarrow V_{amp} \rightarrow V_{adc}
$$

| 符号 | 含义 | 单位 |
|---|---|:---:|
| $I_{phase}$ | 被采样相电流（有符号） | A |
| $R_{shunt}$ | 采样电阻 | $\Omega$ |
| $V_{shunt}$ | 采样电阻差分压降（有符号） | V |
| $Gain$ | 电流采样放大电路电压增益 | 无量纲 |
| $V_{amp}$ | 相对零电流偏置点的有符号电压分量 | V |
| $V_{offset}$ | 零电流时 ADC 引脚偏置电压 | V |
| $V_{adc}$ | 送入 ADC 引脚的实际电压 | V |

换算关系：

$$
V_{shunt}=I_{phase}\times R_{shunt}
$$

$$
V_{amp}=V_{shunt}\times Gain
$$

$$
V_{adc}=V_{offset}+V_{amp}=V_{offset}+I_{phase}\times R_{shunt}\times Gain
$$

反解：

$$
I_{phase}=\frac{V_{adc}-V_{offset}}{R_{shunt}\times Gain}
$$

> - $V_{amp}$ 表示相对偏置点的电压变化量，主要用于说明数学关系；实际运放通常在放大的同时加入偏置，不一定对应独立物理节点。
> - $I_{phase}$ 与 $V_{shunt}$ 的正负取决于电流正方向、采样电阻取压顺序和运放输入极性。硬件极性相反时，公式前需要加负号。
> - $V_{offset}$ 应以零电流上电校准得到的实测码值为准，不要直接写死原理图理论偏置。

### 4.2 STM32G431 片内 OPAMP / PGA

STM32G431 片内 PGA（Programmable Gain Amplifier）是 OPAMP 的可编程增益模式。片内有 **OPAMP1 / OPAMP2 / OPAMP3**，均支持 PGA，VINP、VINM、VOUT 也可引出到外部引脚。

主要特性（数据手册与 AN5306）：

- 轨到轨输入/输出。
- 增益带宽积约 **13~15 MHz**。
- **正常模式 / 高速模式**，转换速率约为 6.5 V/µs / 45 V/µs。
- 内部集成反馈电阻，软件可编程增益。
- 输出可通过 OPAINTOEN 内部直连 ADC，减少外部走线与噪声。
- 支持 Factory / User Trimming 偏移校准。
- 支持定时器控制的输入多路复用。

**PGA 增益：**

| 模式 | 可用增益 |
|---|---|
| 同相（Non-inverting） | 2、4、8、16、32、64 |
| 反相（Inverting） | −1、−3、−7、−15、−31、−63 |

**主要工作模式：**

1. **Standalone：** 完全外部反馈，可做任意增益、滤波和跨阻放大。
2. **Follower：** 增益为 1，用作缓冲。
3. **PGA 同相：** 信号进正输入，增益为正，最常用。
4. **PGA 反相：** 信号进负输入，正输入接偏置（常用 $V_{REF}/2$ 或 DAC），可实现带直流偏置的交流放大。

| 引脚 | 作用 |
|---|---|
| VINP | 正相输入，可接外部引脚或内部 DAC |
| VINM | 反相输入 |
| VOUT | 输出，可外接或内部连接 ADC |

- 同相 PGA：信号进 **VINP**，负输入由内部反馈处理。
- 反相 PGA：信号进 **VINM0**，**VINP** 接偏置。

### 4.3 CubeMX 中的 OPAMP 配置

#### Standalone / Follower

![Standalone](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260717174536250.png)

| 选项 | 说明 |
|---|---|
| **Standalone** | VINP、VINM、VOUT 全外接，增益由外部电阻决定 |
| **Standalone Internally connected_IO** | Standalone + 输出内部连接 ADC，并可保留外部输出 |
| **Standalone-DAC3_OUT1-INP** | 正输入内部连接 DAC3_OUT1 |

![Follower](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260717174516934.png)

| 选项 | 说明 |
|---|---|
| **Follower** | 正输入外部，输出跟随输入 |
| **Follower-DAC3_OUT1-INP** | 正输入来自内部 DAC |
| **Follower Internally Connected** | 跟随器 + 输出内部送 ADC |

#### PGA（重点）

![PGA](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260717174756405.png)

| 选项名称 | 含义 | 典型用途 |
|---|---|---|
| **PGA Not Connected** | 同相 PGA；负输入不外接，内部反馈闭环 | 小信号同相放大（2/4/8/16/32/64） |
| **PGA Not Connected-DAC3_OUT1-INP** | 同上，正输入来自 DAC | DAC 输出放大 |
| **PGA Internally Connected** | PGA + 输出内部直连 ADC | 省去 VOUT 引脚 |
| **PGA Internally connected_IO** | 内部 ADC + 保留外部 IO | 同时需要外部观测与 ADC |
| **PGA Connected-INVERTINGINPUT_IO0_BIAS** | 反相 PGA；信号进 VINM0，正输入接 Bias | 带直流偏置的交流放大 |
| **…-DAC_OUT1-INP_Output_internal** 等 | 反相 PGA + DAC 偏置 + 内部到 ADC | 反相放大 + 内部偏置 + 内部 ADC |
| **PGA Connected** | 较通用的连接版本 | 按实际引脚选择 |

**PGA Gain：**

- 同相 PGA 取正增益（2、4、8……）。
- 带 INVERTINGINPUT 的反相 PGA 取负增益（−1、−3、−7……）。

![PGA Gain](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260717175131393.png)

### 4.4 本项目硬件参数与有效增益

本项目（火柴 FOC / huochaiFOC）采用：

**三电阻低边采样（R3_2） + 双 ADC 同步注入（ADC1/ADC2） + STM32G431 内部 OPAMP1/2/3 放大**。

#### 硬件图与采样路径

- **驱动半桥：**

  ![驱动半桥](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260708195109247.png)

- **采样电阻：**

  ![采样电阻](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260708194934390.png)

- **网络名对应关系：**

  ![网络名交换](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260717213051553.png)

- **偏置电路：**

  ![偏置](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260719101743261.png)

- **主控：**

  ![主控](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260717212917888.png)

- **整体采样路径：**

  ![采样路径总览](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260719213151411.png)

#### 有效增益 $G_{eff}$

采样电阻电压并不直接进运放，而是先经过外部电阻网络，再由片内 OPAMP 的 PGA 放大。因此，软件公式中的 Gain（记为 $G_{eff}$）**不等于** CubeMX 里选择的 PGA 档位 16：

$$
G_{eff}=\text{外部衰减系数 }\alpha\times\text{PGA 增益}
$$

外部网络可理解为：交流信号经 $10\,\mathrm{k}\Omega$ 串联电阻后，接入偏置支路对电源/GND 的并联等效电阻 $R_{bias}$：

$$
R_{bias}=22\,\mathrm{k}\Omega\parallel976\,\Omega
=\frac{22\,\mathrm{k}\Omega\times976\,\Omega}{22\,\mathrm{k}\Omega+976\,\Omega}
\approx934.5\,\Omega
$$

$$
\alpha=\frac{R_{bias}}{10\,\mathrm{k}\Omega+R_{bias}}
=\frac{934.5}{10000+934.5}
\approx0.0855
$$

片内 PGA 取 16 倍：

$$
G_{eff}=\alpha\times16\approx0.0855\times16\approx1.367
$$

> 切勿把 PGA 档位 16 直接当作电流公式中的总增益。

#### 参数表

| 参数 | 数值 |
|---|---:|
| 采样电阻 $R_{shunt}$ | $20\,\mathrm{m}\Omega=0.02\,\Omega$ |
| 总有效增益 $G_{eff}$ | 约 $1.367$ |
| 片内 PGA 档位 | 16（不是总增益） |
| ADC 参考电压 $V_{ref}$ | $3.3\,\mathrm{V}$ |
| ADC 分辨率 | 12 位 |
| 理论零点偏置 $V_{offset}$ | $2.051\,\mathrm{V}$ |

模拟灵敏度：

$$
R_{shunt}\times G_{eff}=0.02\times1.367=0.02734\,\mathrm{V/A}
$$

> ST 官方板 B-G431B-ESC 参数为 $R_{shunt}=3\,\mathrm{m}\Omega、G_{eff}=9.14$，二者的 $R\times G$ 乘积相同（约 0.0274），因此换算因子一致，约为 544 LSB/A。

### 4.5 三相 OPAMP 与 ADC 路径

| 相 | OPAMP 正输入 VINP | 偏置输入 VINM0 | OPAMP 外部输出 | ADC 电流路径 |
|:--:|---|---|---|---|
| U/A | PA1，OPAMP1 | PA3 | PA2 | ADC1_IN3 |
| V/B | PA7，OPAMP2 | PA5 | PA6 | ADC2_IN3 |
| W/C | PB0，OPAMP3 | PB2 | PB1 | ADC1_IN12，或内部 VOPAMP3 → ADC2_IN18 |

**OPAMP 输出到 ADC 的内部连接：**

- OPAMP1、OPAMP2 各自主要有一条内部直连通道，分别对应 ADC1、ADC2。
- OPAMP3 同时具备 ADC1_IN12 与 ADC2_IN18 两条内部直连路径。
- ADC1_IN3、ADC2_IN3、ADC1_IN12、ADC2_IN18 均为内部连接。

**PA2、PA6、PB1：**

- 是运放真实输出脚，可作为示波器测试点。
- 与对应 ADC 输入通道共用同一焊盘，无需飞线到其它 ADC 引脚。

MCU 只有 ADC1、ADC2 两个转换器，因此每个 PWM 周期只能同步采集两相可信电流，第三相由 $I_u+I_v+I_w=0$ 重构。硬件上将 U 固定路由到 ADC1、V 固定路由到 ADC2，W 可同时路由到两只 ADC，软件再按当前 SVPWM 扇区在三种两相组合间切换。

W 相经 OPAMP3 的双路径示意：

~~~text
W 相采样信号 → PB0 → OPAMP3
                         ├─ 共享焊盘：OPAMP3_VOUT → PB1 / ADC1_IN12
                         └─ 不经引脚：VOPAMP3 → ADC2_IN18
~~~

---

## 5. ADC 数据格式与电流换算

### 5.1 ADC 对齐方式

STM32 ADC 多为 12 位，码值范围为 $0\sim4095$。结果装入 16 位数据寄存器（ADC_DR / JDRx）时有两种摆放方式：

| 对齐方式 | 数据位置 | 理论最大值 | 常用满量程近似 | 说明 |
|---|---|---:|---:|---|
| **右对齐（默认）** | 低 12 位 bit[11:0]，高位补 0 | 4095 | **4096** | 数值直观 |
| **左对齐** | 高 12 位 bit[15:4]，低位补 0 | $4095\ll4=65520$ | **65536** | 便于定点运算 |

示例：转换结果为 0xABC（二进制 1010 1011 1100）。

| 对齐方式 | 16 位寄存器内容 | 十六进制 | 按整数直接解读 |
|---|---|---|---:|
| 右对齐 | 0000 1010 1011 1100 | 0x0ABC | 2748 |
| 左对齐 | 1010 1011 1100 0000 | 0xABC0 | 43968 |

左对齐相当于硬件完成一次 ×16（左移 4 位），使 ADC 原始值接近 Q15 数值范围：

- **右对齐 → Q15：** 先在 12 位域做差，再左移 4 位填满 16 位。
- **左对齐 → Q15：** 硬件先左移 4 位，再在 16 位域做差，结果直接是 Q15 量级。

选型建议：

| MCU | 是否有 FPU | 推荐数据表示 | 推荐 ADC 对齐 |
|---|---|---|---|
| G4 / F4 / H7 等 | 有 | float | 右对齐 |
| F1 / F0 / G0 等 | 无 | 定点 Q 格式 | 左对齐 |

STM32G431 带单精度 FPU，可以直接使用 float；移植到无 FPU 内核或对接 CMSIS-DSP / 旧版电机库时，仍会遇到大量 Q 格式。

### 5.2 浮点与定点（Q 格式）

电流换算后，FOC 还要进行 Clarke / Park、PI 和限幅。常见表示方式如下：

| 表示方式 | 典型类型 | 优点 | 缺点 |
|---|---|---|---|
| **浮点** | float | 写法直观，动态范围大 | 无硬件 FPU 时运算慢，增加电流环负担 |
| **定点（Q 格式）** | int16_t / int32_t | 用整数完成小数运算，无 FPU 时更快 | 需约定小数位，并注意溢出和饱和 |

#### Q 格式基础

本质是把真实小数放大 $2^n$ 倍，用有符号整数存储和运算，约定写成 Qm.n：

| 符号 | 含义 |
|---|---|
| $m$ | 整数部分位数（含 1 位符号位） |
| $n$ | 小数部分位数 |
| 总位数 | $m+n$ |

$$
Q=\operatorname{round}(x\times2^n),\qquad x=\frac{Q}{2^n}
$$

#### Q15（即 Q1.15）

对应 16 位有符号整数 int16_t：

| 项目 | 说明 |
|---|---|
| 总位数 | 16 |
| 符号位 | bit15（补码） |
| 小数位 | 15 位（bit14~bit0） |
| 整数位 | 0 位（除符号位外全是小数） |
| 放大倍数 | $2^{15}=32768$ |
| 数值范围 | $[-1,1)$ |
| 分辨率 | $1/32768\approx3.05\times10^{-5}$ |

| 真实值 $x$ | Q15 码值 |
|---:|---:|
| $-1.0$ | $-32768$（0x8000） |
| $0$ | $0$ |
| 接近 $+1.0$ | $+32767$（0x7FFF） |

Q15 适合表示归一化量，例如单位正弦/余弦、占空比系数、标幺化电流/电压。物理量超过 ±1 时，需要先按额定值归一化，或改用整数位更多的格式。

#### Q12（常用作 Q4.12）

| 项目 | 说明 |
|---|---|
| 总位数 | 16 |
| 符号位 | bit15 |
| 整数位 | 3 位（bit14~bit12） |
| 小数位 | 12 位（bit11~bit0） |
| 放大倍数 | $2^{12}=4096$ |
| 数值范围 | $[-8,8)$ |
| 分辨率 | $1/4096\approx2.44\times10^{-4}$ |

| 格式 | 完整写法 | 范围 | 分辨率 | 典型用途 |
|---|---|---|---|---|
| Q15 | Q1.15 | $[-1,1)$ | 更细 | 归一化系数、三角函数表 |
| Q12 | Q4.12 | $[-8,8)$ | 稍粗 | 需要少量整数余量的中间量 |

### 5.3 电流换算系数

把 ADC 数字量转换为电流（A）的灵敏度（LSB/A）为：

$$
K_I=\frac{\text{满量程数字量}\times R_{shunt}\times G_{eff}}{V_{ref}}
$$

代入本项目参数（$R_{shunt}=0.02\,\Omega$、$G_{eff}\approx1.367$、$V_{ref}=3.3\,\mathrm{V}$）：

| 对齐方式 | 满量程近似 | $K_I$ |
|---|---:|---:|
| 左对齐 | 65536 | $\dfrac{65536\times0.02\times1.367}{3.3}\approx543.0\,\mathrm{LSB/A}$ |
| 右对齐 | 4096 | $\dfrac{4096\times0.02\times1.367}{3.3}\approx33.94\,\mathrm{LSB/A}$ |

工程中常用约 $544.5\,\mathrm{LSB/A}$（对应板级参数 $R\times G\approx0.0274$）：

$$
I\ (\mathrm{A})=\frac{\mathrm{ADC}-\mathrm{Offset}}{K_I}
=(\mathrm{ADC}-\mathrm{Offset})\times0.001837
$$

其中 $1/K_I\approx0.001837\,\mathrm{A/LSB}$。Offset 必须通过实际多次采样平均得到，计算出的电流带符号。

### 5.4 采集量程核算

由：

$$
V_{adc}=V_{offset}+I_{phase}\times R_{shunt}\times G_{eff}
$$

且 $0<V_{adc}<V_{ref}$，可得：

$$
I_+=\frac{V_{ref}-V_{offset}}{R_{shunt}G_{eff}},\qquad
I_-=\frac{V_{offset}}{R_{shunt}G_{eff}}
$$

代入 $V_{offset}=2.051\,\mathrm{V}$、$R_{shunt}G_{eff}=0.02734\,\mathrm{V/A}$：

| 方向 | 可测电流 |
|---|---:|
| 正电流上限 $I_+$ | $(3.3-2.051)/0.02734\approx45.7\,\mathrm{A}$ |
| 负电流上限 $I_-$ | $2.051/0.02734\approx75.0\,\mathrm{A}$ |

双向量程由较紧的一侧限制，理论约为 ±45.7 A。实际可用量程还要扣除运放饱和余量、PCB 走线压降和噪声，工程上宜再留 20%~30% 裕量。

### 5.5 零点偏置校准

应在上电后、**PWM 输出关闭且确认三相无电流**时校准：

1. 连续触发 ADC，对 U/V/W 各采样 16 次或更多。
2. 分别累加并求平均。
3. 存入 PhaseAOffset、PhaseBOffset、PhaseCOffset。
4. 运行时使用：

$$
I=(\mathrm{ADC}-\mathrm{Offset})\times\frac{1}{K_I}
$$

注意：

- 校准期间驱动应关闭，电机静止且无续流。
- 不要用原理图理论 $V_{offset}$ 直接当作运行时零点。
- 若运放或 ADC 温漂明显，可在上电或空闲状态周期性重校准。

---

## 6. 项目定时器与 ADC 配置

### 6.1 TIM1 基本参数

当前工程的记录为：

| 参数 | 设置 | 说明 |
|---|---:|---|
| Prescaler（PSC） | 0 | 定时器时钟不分频 |
| Counter Mode | **Center Aligned mode 1** | 中心对齐模式 1 |
| Counter Period（ARR） | **5312** | 自动重装载值，决定 PWM 频率 |
| Internal Clock Division（CKD） | Division by 2 | 死区时间和数字滤波器的时钟分频 |
| Repetition Counter（RCR） | 1 | 每计数 2 个周期才产生一次更新事件 |
| Auto-reload preload | Enable | ARR 预装载，防止更新毛刺 |

定时器时钟为 170 MHz 时：

$$
f_{PWM}=\frac{f_{TIM}}{2\times(ARR+1)}
=\frac{170000000}{2\times5313}\approx16\,\mathrm{kHz}
$$

### 6.2 PWM 通道与 CH4 触发

#### Channel 模式

| 模式 | 说明 | 电机控制用途 |
|---|---|---|
| **PWM Generation CHx CHxN** | 产生带死区的互补 PWM | 三相桥上下管驱动（CH1~CH3） |
| PWM Generation CHx | 只产生单路 PWM | 单管驱动、普通 PWM |
| PWM Generation No Output | 内部产生 PWM，但不输出到引脚 | 用于触发 ADC（CH4） |
| Output Compare | 比较匹配时翻转/置位/清零引脚 | 精确时间点输出 |
| Forced Output | 强制输出高/低电平 | 软件强制关断 |

![Channel 模式](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260721130952810.png)

| 通道 | 模式 | Pulse 值 | 作用 |
|---|---|---:|---|
| CH1/2/3 | PWM mode 1 | 0（初始） | 输出互补 PWM 驱动三相桥 |
| **CH4** | **PWM mode 2** | **5311** | 专门触发 ADC |

#### 定时器配置

![定时器配置](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260722122843618.png)

以向上计数为例：

| 模式 | 行为 | 特点 | 使用场景 |
|---|---|---|---|
| **PWM mode 1** | CNT 小于 CCR 输出有效，CNT 大于等于 CCR 输出无效 | 最常用、直观 | 三相电机控制首选 |
| **PWM mode 2** | 与 mode 1 完全相反 | 极性相反 | 反向有效电平或配合触发 |

![PWM mode](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260722131132532.png)

### 6.3 TRGO 触发链路

| 参数 | 当前设置 | 作用 |
|---|---|---|
| Master/Slave Mode（MSM） | Disable | 不延迟触发 |
| Trigger Event Selection（TRGO） | **Output Compare（OC4REF）** | 用 CH4 比较匹配信号作为 TRGO |
| Trigger Event Selection（TRGO2） | Reset（UG bit） | 更新事件作为 TRGO2 |

![TRGO 配置](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260724141850829.png)

当前工程记录的完整配置：

~~~text
TIM1：中心对齐模式 1，ARR = 5312
CH1~CH3：PWM mode 1，有效电平为高
CH4：PWM mode 2，CCR4 = 5311
TRGO：OC4REF
ADC：TIM1_TRGO 上升沿触发
~~~

每当 PWM 走到预定采样位置，OC4REF 通过 TRGO 触发 ADC 注入组。实际采样位置仍应结合当前 PWM 极性、运放建立时间和示波器波形确认。

当前工程 TIM1 电流采样时序（扇区 1 示例）：

![TIM1 电流采样时序](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260724091904273.png)

扇区 1 示例中记录为：

~~~text
CCR_U > CCR_V > CCR_W
~~~

### 6.4 ADC 注入组与 JSQR

#### ADC 注入组配置

![ADC 注入组配置](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260725135031750.png)

- **Number Of Conversions：** 2，即注入组使用两个通道。
- **External Trigger Source：** 当前使用 TIM1_TRGO，经过可编程路由输出 OC4REF，适合当前动态采样位置。
- TIM1_TRGO2 是第二套触发路由，当前没有使用。
- TIM1_CC4 是直接比较匹配事件；中心对齐模式下一周期通常出现两次，不适合当前单次采样和动态边沿切换。
- **External Trigger Edge：** 上升沿。

JSQR（Injected Sequence Register）决定注入组要转换的通道、转换序列长度以及外部触发源。

配置采样通道的基本表达式：

~~~c
((channel << ADC_JSQR_JSQ1_Pos) & ADC_JSQR_JSQ1)
~~~

完整的触发配置示例：

~~~c
static uint32_t current_shunt_jsqr(uint32_t channel, uint32_t edge)
{
    return ((channel << ADC_JSQR_JSQ1_Pos) & ADC_JSQR_JSQ1) |
           (LL_ADC_INJ_TRIG_EXT_TIM1_TRGO & ADC_JSQR_JEXTSEL) |
           (edge & ADC_JSQR_JEXTEN);
}
~~~

### 6.5 ADC 中断处理流程

扇区 1 示例的硬件链路如下：

~~~mermaid
graph TD
    Start[开始] --> TIM1_CNT_CCR4[TIM1 CNT == CCR4]
    TIM1_CNT_CCR4 --> OC4REF_Rising[OC4REF 产生上升沿]
    OC4REF_Rising --> MMS_Config[TIM1_CR2.MMS = OC4REF]
    MMS_Config --> TIM1_TRGO_Rising[TIM1_TRGO 产生上升沿]
    TIM1_TRGO_Rising --> ADC1_Injected_Start[ADC1 注入组开始转换]
    TIM1_TRGO_Rising --> ADC2_Injected_Start[ADC2 注入组开始转换]
    ADC2_Injected_Start --> ADC2_JEOS_Generated[ADC2 产生 JEOS]
    ADC1_Injected_Start --> ADC2_JEOS_Generated
    ADC2_JEOS_Generated --> ADC1_2_IRQHandler[进入 ADC1_2_IRQHandler]
    ADC1_2_IRQHandler --> Read_Data[读取 ADC1->JDR1、ADC2->JDR1]
~~~

---

## 7. 软件电流重构

定时器在预定的零矢量窗口触发 ADC1 与 ADC2，同步采回当前扇区内最可靠的两相电流。第三相不直接采样，而由三相电流和为零的约束重构。

### 7.1 占空比盲区

某一相占空比极高时，上管导通时间很长、下管导通时间很短。当下管窗口短于“死区 + 模拟前端建立时间 + ADC 采样时间”时，采样点会落在开关振铃区或有效窗口外，该相结果不可信，这就是采样盲区。

### 7.2 按 SVPWM 扇区选择采样相

在线性调制区内，通常只有占空比最高的一相最接近盲区。因此应根据**当前正在生效的 PWM 扇区**，选择另外两相做双 ADC 同步采样，再利用 $I_u+I_v+I_w=0$ 重构第三相。

> 若定时器开启 CCR 预装载，ADC 中断中新计算的占空比要到下一个更新事件才生效。采样通道选择必须使用与**当前 CCR1/2/3** 对应的扇区，不能误用刚计算出的下一周期扇区。

**扇区 1 示例：**

- 扇区 1 由基本矢量 $V_1(100)、V_2(110)$ 和零矢量 $V_0(000)、V_7(111)$ 共同作用。
- U 相（A 相）占空比最高，下管导通最短，最容易进入盲区。
- V、W 下管导通较长，采样更可靠。
- 双 ADC 采 V、W，再计算 $I_u=-I_v-I_w$。

![扇区示意](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260708203714332.png)

![采样盲区示意图](https://kyro-qu.github.io/blog-images-1/posts/foc-current-sensing/image-20260708205129821.png)

### 7.3 采样与重构策略

| SVPWM 扇区 | 占空比最高相 | ADC1 采样 | ADC2 采样 | 软件重构 |
|:---:|:---:|:---:|:---:|---|
| 1、6 | U | W | V | $I_u=-(I_v+I_w)$ |
| 2、3 | V | U | W | $I_v=-(I_u+I_w)$ |
| 4、5 | W | U | V | $I_w=-(I_u+I_v)$ |

对应硬件路由：U→ADC1、V→ADC2，W 可进 ADC1 或 ADC2，才能在三种两相组合间切换。

### 7.4 工程实现要点

- ADC 采样必须与 PWM 硬件同步，避免在软件中断里临时启动采样。
- 扇区判断使用当前已经生效的 CCR，而不是下一周期待写入的 CCR。
- 采样结果先减去各相独立的 Offset，再乘以对应换算系数。
- 先确认 ADC1、ADC2 的注入组完成标志和读取顺序，再进入 Clarke / Park 变换。
- W 相需要根据当前扇区动态切换到 ADC1 或 ADC2 的可用路径。
- 若有效采样窗口不足，应降低调制度、调整采样位置，或引入移相/电流重构补偿，不能继续使用不可信采样值。
- 应使用示波器同时观察 PWM、ADC 触发点和 OPAMP 输出，确认采样点避开开关沿和模拟建立过程。

---

## 8. 参考资料

- [TI 应用笔记：基于分流器的无传感器 FOC 三相电机相电流检测（PDF）](https://www.ti.com.cn/cn/lit/an/zhcaai8/zhcaai8.pdf)
- STM32G4 系列参考手册 / 数据手册：OPAMP、ADC、定时器章节
- ST AN5306：STM32G4 运算放大器与 PGA 应用说明
- ST Motor Control SDK（MCSDK）三电阻双 ADC（R3_2）电流采样实现
