---
title: "X-CUBE-MCSDK"
subtitle: "从工程生成到 Motor Pilot 与 Motor Profiler"
date: 2026-08-02T15:38:12+08:00
draft: false
tags: ["FOC"]
featured: false
mood: "focus"
description: "整理 X-CUBE-MCSDK 的 Workbench、Motor Pilot、Motor Profiler 使用流程，以及火柴 FOC 驱动板配置与定时器参数。"
image: "/images/og/x-cube-mcsdk.png"
---
## 1. 简介

X-CUBE-MCSDK 是 ST（意法半导体）面向 STM32 的电机控制软件开发套件（Motor Control Software Development Kit，MCSDK）。完成电机、功率板和控制参数配置后，可以生成 FOC 或六步换相工程，从而减少底层初始化和控制框架的搭建工作。

生成的项目可继续通过 STM32CubeMX 配置其他外设，并使用 STM32CubeIDE、Keil MDK 或 IAR 等工具编译和调试。

### 1.1 参考资料

- [ST 官方入门手册：STM32 Motor Control SDK 6.0.0](https://wiki.st.com/stm32mcu/wiki/STM32MotorControl:Getting_started_SDK_6.0.0)
- 《STM32G4 入门与电机控制实战：基于 X-CUBE-MCSDK 的无刷直流电机与永磁同步电机控制实现》

## 2. 软件工具

MCSDK 开发流程主要使用 Motor Control Workbench 和 Motor Pilot。Motor Profiler 集成在 Motor Pilot 中，用于测量电机参数。

### 2.1 Motor Control Workbench

Motor Control Workbench 用于完成以下工作：

- 选择 ST 官方板卡或建立自定义板卡；
- 配置电机、电源、功率级和位置反馈；
- 选择 FOC 或六步换相算法；
- 调用 STM32CubeMX 生成初始化代码和电机控制工程；
- 启动 Motor Pilot，连接目标板并调试电机。

### 2.2 Motor Pilot（电机调试台）

Motor Pilot 用于在线控制和监视目标板，主要功能包括：

- 启动或停止电机；
- 设置目标转速或目标转矩；
- 查看并清除故障；
- 实时绘制转速、电流和电压等变量；
- 在线调整 PI/PID 参数及其他可写变量。

### 2.3 Motor Profiler（电机分析仪）

Motor Profiler 是 Motor Pilot 中的电机参数测量工具，可用于估算 PMSM/BLDC 的电气参数。开始测量前通常需要填写：

- 极对数（Pole Pairs）；
- 最大允许电流；
- 目标或最大转速。

输出参数通常包含定子电阻 $R_s$、定子电感 $L_s$、反电动势常数 $K_e$，以及部分机械模型参数。

![Motor Profiler 界面](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212180941739.png)

## 3. 参考硬件

### 3.1 B-G431B-ESC1

记录参数：

- 工作电压：8～28 V；
- 额定电流：40 A；
- 外部晶振：8 MHz。

![B-G431B-ESC1](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/imagepf267025enfeature-description-include-personalized-no-cpn-medium.jpg)

板载按键可用于启动或停止电机，电位器可用于调速。具体功能取决于生成工程中的用户接口配置。

### 3.2 X-NUCLEO-IHM08M1

X-NUCLEO-IHM08M1 是三相电机驱动扩展板，记录配置如下：

- L6398 半桥栅极驱动器与 STL220N6F7 功率 MOSFET 组成三相功率级；
- 直流工作电压：10～48 V；
- 峰值电流：3～30 A；
- 当前搭配的控制板 MCU：STM32F446RETx。

## 4. 开发流程

建议按以下顺序建立工程：

1. 在 Motor Control Workbench 中选择控制板和功率板，并填写已知或近似的电机参数。
2. 生成并烧录可供 Motor Profiler 使用的工程。
3. 在 Motor Pilot 中启动 Motor Profiler，测量电机参数并导出 JSON 配置文件。
4. 新建正式工程，导入已测得的电机参数。
5. 核对电源、电流采样、位置反馈、保护阈值和 PWM 配置。
6. 生成代码，并在 STM32CubeMX 中补充其他外设。
7. 编译、烧录后，通过 Motor Pilot 进行低压、限流调试。

> 首次调试应限制母线电压、相电流和目标转速，并确保硬件过流、过压保护能够正常动作。

## 5. Motor Control Workbench

### 5.1 新建工程

1. 创建新工程。

   ![新建工程](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212093858587.png)

2. 选择电机。

   ![选择电机](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212093921791.png)

3. 导入已有电机配置，或复制参数接近的电机模板，再修改名称和参数。

   ![导入或复制电机配置](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212094034090.png)

4. 选择控制板和功率板。

   ![选择电路板](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212094112708.png)

5. 选择控制算法和位置反馈方式。

   ![选择算法](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212094313614.png)

### 5.2 电机与电源参数

电机页面中的额定电压和电流描述电机自身允许的工作范围，应根据电机规格和散热条件填写。电机不必始终工作在最大额定电压下，可以在更低母线电压下运行，但高速和带载能力会相应下降。

电源页面中的 **Application Voltage** 表示实际施加到驱动板的直流母线电压。MCSDK 会据此配置或建议欠压、过压等保护阈值。因此需要区分：

- **电机额定电压：** 电机允许承受的电气条件；
- **应用电压：** 当前系统实际使用的母线电压。

两者可以相同，也可以在电机额定范围内使用更低的应用电压。

![电机与应用电压配置](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212223953960.png)

### 5.3 位置反馈与观测器

| 方案 | Workbench 选项 | 说明 |
|---|---|---|
| 无位置传感器 FOC | STO-PLL | 状态观测器结合锁相环估算转子位置和速度 |
| 无位置传感器 FOC | STO-CORDIC | 状态观测器结合 CORDIC 角度计算 |
| 霍尔 FOC | Hall Sensors | 使用三路霍尔信号获得转子区间位置 |
| 正交编码器 FOC | Quadrature Encoder | 使用 A/B 正交信号获得转子位置 |

STO-PLL 和 STO-CORDIC 都是无位置传感器估算方案，并非简单的“闭环”和“开环”之分。具体选择应结合 MCU、MCSDK 版本、电机速度范围和官方示例；初次使用时可优先沿用对应参考板的默认方案。

### 5.4 生成代码

选择目标开发环境和代码生成选项，例如 Keil MDK 与 LL 库。LL 接口开销通常较低，但是否选择 LL 仍应结合现有工程结构、维护成本和 MCSDK 版本支持情况决定。

![生成代码](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260211162834221.png)

## 6. Motor Pilot

### 6.1 连接目标板

可通过 Motor Control Workbench 中的专用按钮启动 Motor Pilot。

![启动 Motor Pilot](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260211163052600.png)

在连接页面中搜索目标板并建立通信：

![查找目标板](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212084706894.png)

### 6.2 波形观察

Motor Pilot 的 Plot 窗口可作为软件示波器使用：

![示波器窗口](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212223300311.png)

在变量区域右键，可将需要观察的变量添加到波形窗口：

![添加波形变量](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212223702984.png)

### 6.3 运行注意事项

部分无感 FOC 配置不适合在运行中直接将目标速度从正值切换为负值。较稳妥的操作顺序为：

1. 发送 Stop 命令；
2. 等待电机停止或进入安全状态；
3. 设置负向目标速度；
4. 重新发送 Start 命令。

是否支持不停机反转取决于生成的状态机、速度斜坡、启动策略和 MCSDK 版本，不能只依赖上位机目标值完成方向切换。

## 7. Motor Profiler

### 7.1 启动与参数填写

Motor Profiler 用于自动测量 PMSM/BLDC 的电气参数。它不是生成项目的必需工具；当电机参数未知或需要重新测量时，可以使用该功能。

在 Motor Pilot 中选择并加载 Motor Profiler：

![加载 Motor Profiler](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212084857571.png)

填写以下电机信息：

- 极对数：必填；
- 最大电流：必填；
- 最大转速：根据工具要求填写。

![填写电机参数](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260212084937727.png)

### 7.2 测量与保存

完成测量后保存电机参数。当前使用记录显示，简介字段填写中文可能出现乱码，建议使用英文或 ASCII 字符。

![保存电机参数](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260211160630841.png)

若首次测量无法覆盖目标工作区间，可在电机和功率板安全范围内逐步提高测试电流或转速，再重新测量。不得为获得结果而超过电机、电源或功率级的额定值。

![调整 Profiler 测试范围](https://kyro-qu.github.io/blog-images-1/posts/x-cube-mcsdk/image-20260211162129049.png)

### 7.3 参数示例

以下为一次 Profiler 测量结果记录。$R_s$ 和 $L_s$ 的相值/线值定义应以当前 MCSDK 版本的界面和文档为准。

**电气模型参数（Electrical Model）：**

| 参数 | 数值 | 单位 | 含义 |
|---|---:|---|---|
| $R_s$ | 0.2 | Ω | 定子电阻（Stator Resistance） |
| $L_s$ | 0.05 | mH | 定子电感（Stator Inductance） |
| $V_{bus}$ | 14.23 | V | 直流母线电压（Bus Voltage） |
| $I_{max}$ | 5.2 | A peak | 最大峰值电流（Maximum Peak Current） |
| $K_e$ | 0.86 | Vrms/krpm | 反电动势常数（Back-EMF Constant） |

**机械模型参数（Mechanical Model）：**

| 参数 | 数值 | 单位 | 含义 |
|---|---:|---|---|
| 摩擦系数 | 0.4 | µN·m·s | 粘性摩擦系数（Viscous Friction Coefficient） |
| 转动惯量 | 0.36 | µN·m·s² | 转动惯量（Inertia） |
| 最大转速 | 10700 | rpm | 测量或配置的最大转速 |

## 8. 火柴 FOC 驱动板配置

### 8.1 硬件概览

火柴 FOC 是一块基于 STM32G431CBU6 的无刷电机驱动板，当前硬件记录如下：

- **主控单元：** STM32G431CBU6，48 引脚；
- **三相逆变桥：** 6 个 MOSFET 和栅极驱动芯片；
- **电源系统：** 标称 24 V 输入，生成 10 V、5 V 和 3.3 V 电源；
- **通信与调试：** UART、CAN 和 SWD；
- **采样电路：** 三相电流、母线电压、温度和电位器输入；
- **工作电压记录：** 8～48 V；
- **相电流记录：** 建议持续使用不超过 5 A，散热良好时记录值为 10 A，瞬时记录值为 20 A。

> 电流能力必须结合 MOSFET、采样电阻、PCB 铜厚、接口和散热实测确认，不能只按器件标称电流使用。

### 8.2 引脚分配

#### 8.2.1 三相半桥 PWM（TIM1）

| 引脚 | 复用功能 | 信号名 | 说明 |
|---|---|---|---|
| PA8 | TIM1_CH1 | PWM_CHU_H | U 相上桥臂 |
| PA9 | TIM1_CH2 | PWM_CHV_H | V 相上桥臂 |
| PA10 | TIM1_CH3 | PWM_CHW_H | W 相上桥臂 |
| PC13 | TIM1_CH1N | PWM_CHU_L | U 相下桥臂 |
| PA12 | TIM1_CH2N | PWM_CHV_L | V 相下桥臂 |
| PB15 | TIM1_CH3N | PWM_CHW_L | W 相下桥臂 |

#### 8.2.2 电流检测与内置运放

| 引脚 | 复用功能 | 信号名 | 说明 |
|---|---|---|---|
| PA1 | OPAMP1_VINP / COMP1_INP | CURRENT_SHUNT_UP | U 相电流正端（运放与比较器输入） |
| PA3 | OPAMP1_VINM0 | CURRENT_SHUNT_UN | U 相电流负端 |
| PA2 | OPAMP1_OUT / ADC1_IN3 | OPAMP1_OUT | U 相运放输出，内部连接 ADC1 |
| PA7 | OPAMP2_VINP / COMP2_INP | CURRENT_SHUNT_VP | V 相电流正端 |
| PA5 | OPAMP2_VINM0 | CURRENT_SHUNT_VN | V 相电流负端 |
| PA6 | OPAMP2_OUT / ADC2_IN3 | OPAMP2_OUT | V 相运放输出，内部连接 ADC2 |
| PB0 | OPAMP3_VINP / COMP4_INP | CURRENT_SHUNT_WP | W 相电流正端 |
| PB2 | OPAMP3_VINM0 | CURRENT_SHUNT_WN | W 相电流负端 |
| PB1 / VPOPAMP3 | OPAMP3_OUT / ADC1_IN12 / ADC2_IN_VPOPAMP3 | OPAMP3_OUT | W 相运放输出，可由 ADC1/ADC2 采样 |

#### 8.2.3 模拟量采集（ADC）

| 引脚 | ADC 通道 | 信号名 | 说明 |
|---|---|---|---|
| PA0 | ADC1_IN1 | VBUS | 母线电压检测 |
| PB14 | ADC1_IN5 | TEMPERATURE_NTC | NTC 温度检测 |
| PB12 | ADC1_IN11 | POTENTIOMETER_LEVEL | 电位器调速输入 |

#### 8.2.4 通信接口

| 引脚 | 复用功能 | 信号名 |
|---|---|---|
| PB3 | USART2_TX | UART_TX |
| PB4 | USART2_RX | UART_RX |

#### 8.2.5 时钟与调试

| 引脚 | 复用功能 | 说明 |
|---|---|---|
| PF0 | RCC_OSC_IN | 8 MHz 外部高速晶振输入 |
| PF1 | RCC_OSC_OUT | 外部高速晶振输出 |
| PA13 | SYS_JTMS-SWDIO | SWD 调试数据 |
| PA14 | SYS_JTCK-SWCLK | SWD 调试时钟 |

#### 8.2.6 数字输入

| 引脚 | 功能 | 信号名 |
|---|---|---|
| PC10 | GPIO_Input | BUTTON_TRIGGER |

### 8.3 TIM1 配置记录

当前记录值：

| 参数 | 数值 | 说明 |
|---|---:|---|
| 计数模式 | 中心对齐 | 计数器上、下计数形成对称 PWM |
| 定时器时钟 | 170 MHz | TIM1 输入时钟 |
| PSC | 0 | 计数器不分频 |
| ARR | 98 | 自动重装载值，需复核 |
| CKD | 2 | $t_{DTS}=2t_{CK\_INT}$ |
| DTG | 63 | 第一编码区间内的死区计数值 |
| 死区时间 | 约 741 ns | 接近目标值 750 ns |

中心对齐模式下，PWM 频率近似为：

$$
f_{PWM}=\frac{f_{TIM}}{2(PSC+1)(ARR+1)}
$$

代入 $f_{TIM}=170\text{ MHz}$、$PSC=0$、$ARR=98$，得到：

$$
f_{PWM}\approx858.6\text{ kHz}
$$

该频率明显高于常见电机控制 PWM 频率，因此 **ARR = 98 很可能是抄录错误或并非最终运行配置，需要回到 CubeMX/Workbench 工程复核**。若目标频率为 20 kHz，在相同计数模式和时钟下，ARR 应接近 4249。

CKD 不直接改变 TIM1 计数器时钟，但会影响死区发生器使用的 $t_{DTS}$。当 $CKD=2$ 时：

$$
t_{DTS}=\frac{2}{170\text{ MHz}}\approx11.76\text{ ns}
$$

在 DTG 的第一编码区间内，$DTG=63$ 对应：

$$
t_{dead}=63t_{DTS}\approx741\text{ ns}
$$

最终死区值仍需结合栅极驱动器传播延迟、MOSFET 开关时间和实测波形确认。
