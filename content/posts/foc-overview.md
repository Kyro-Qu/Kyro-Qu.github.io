---
title: "FOC 全局总览"
subtitle: "从电机基础到 SVPWM 与软件架构"
date: 2026-08-02T15:32:27+08:00
draft: false
tags: ["FOC"]
featured: false
mood: "focus"
description: "系统梳理无刷电机、三相逆变器、坐标变换、SVPWM、开闭环控制、编码器及软件架构等 FOC 核心知识。"
image: "/images/og/foc-overview.png"
---
**专题文章：** [电流采集与重构](/posts/foc-current-sensing/) · 编码器校准（暂未发布）

## 1. 项目概览

### 1.1 参考资料

#### 教程与基础资料

- [灯哥开源 FOC](https://dengfoc.com/#/)
- [深入浅出讲解 FOC 算法与 SVPWM 技术](https://zhuanlan.zhihu.com/p/147659820)
- [SimpleFOC 中文资料](https://simplefoc.cn/#/simplefoc_translation/1%E9%A6%96%E9%A1%B5.md)
- [没有专业术语！新手小白也能看懂的 FOC 科普](https://www.bilibili.com/video/BV1XvtNeaE54/?share_source=copy_web&vd_source=09f14fdf84ff6c72a299be3f314a768e)
- [正点原子：手把手教你学 STM32 电机应用控制](https://www.bilibili.com/video/BV1hv4y1g7s3/?p=56&share_source=copy_web&vd_source=09f14fdf84ff6c72a299be3f314a768e)
- [FOC 视频教程](https://www.bilibili.com/video/BV1J5411c7Jv/?p=3&share_source=copy_web&vd_source=09f14fdf84ff6c72a299be3f314a768e)
- [FOC 电机驱动板更新记录](https://www.bilibili.com/video/BV12WRzYwEhv/?share_source=copy_web&vd_source=09f14fdf84ff6c72a299be3f314a768e)
- [微信公众号文章](https://mp.weixin.qq.com/s/CPMYkUJWiewcliGp4NWQWw)

#### 无感与开源工程

- **无感关键词：** 高频注入、滑模观测器、磁链观测器。
- [ODrive Hardware](https://github.com/odriverobotics/ODriveHardware/tree/master/v3)
- [FOC 电机驱动器开源工程](https://gitee.com/open-source_18/foc-motor-driver.git)
- [loop222 博客](https://blog.csdn.net/loop222?type=blog)
- [ODrive Robotics 主页](https://odriverobotics.com/)
- [ODrive Robotics YouTube 频道](https://www.youtube.com/@ODriveRobotics)
- [ODrive 文档（v0.5.4）](https://docs.odriverobotics.com/v/0.5.4/getting-started.html)
- [Fibre / ODrive 通信架构示例](https://github.com/embedded-idea/fibre_study)
- [Stanford Doggo 项目视频](https://www.youtube.com/watch?v=2E82o2pP9Jo)

#### 书籍与视频

- 《深入理解无刷直流电机矢量控制技术》，上官致远。
- 《现代永磁同步电机控制原理及 MATLAB 仿真》，袁雷。
- [手把手教写 FOC 算法：开环速度代码的前置知识](https://www.bilibili.com/video/BV1Pc411s7mP/?share_source=copy_web&vd_source=09f14fdf84ff6c72a299be3f314a768e)
- [灯哥 FOC 教程](https://www.bilibili.com/video/BV1cj411M7Xu/)
- [唐老师电赛硬件讲解](https://www.bilibili.com/video/BV1eV41187sK/)
- [ODrive 文档整理](https://blog.csdn.net/abf1234444/article/details/103325808)

## 2. 无刷电机基础

无刷电机与有刷电机的主要区别在于换向方式：有刷电机依靠电刷和换向器进行机械换向，无刷电机则由逆变器根据转子位置进行电子换向。电机转速与供电电压、KV 值、负载和控制策略有关，转速也决定了所需的电气换向频率。

**BLDC 与 PMSM**

BLDC（Brushless Direct Current Motor，无刷直流电机）与 PMSM（Permanent Magnet Synchronous Motor，永磁同步电机）都采用永磁转子。两者通常按反电动势和理想相电流波形区分：BLDC 多呈梯形反电动势，常用六步换相；PMSM 多呈正弦反电动势，常用正弦电流和 FOC 控制。实际电机的波形和适用算法并没有绝对边界。

![image-20251101004747890](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101004747890.png)

![图片](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/20230331051731772.jpg)

**定子**是固定不动的部分，通常由硅钢片铁芯和铜线绕组组成。

**转子**是电机的旋转部分，永磁电机的转子通常装有交替排列的永磁体（如钕铁硼磁体），用于产生转矩并输出机械运动。

![image-20251031234854585](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251031234854585.png)

- **内转子无刷电机：** 转子位于定子内部。
- **外转子无刷电机：** 转子位于定子外侧，航模电机中较为常见。

![image-20251012160128841](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012160128841.png)

### 2.1 关键参数

**KV 值：** 表示理想空载条件下，电机每增加 1 V 电压所增加的转速，常用单位为 rpm/V。近似关系为：

$$
n_0 \approx K_V U
$$

实际转速会受绕组压降、负载、电调和供电能力影响。一般而言，高 KV 电机匝数较少、反电动势常数较低，适合高转速；低 KV 电机匝数较多，通常更适合低速大转矩应用，但最终能力还取决于电机尺寸、磁路和允许电流。

**极数与极对数：** 转子磁极总数为极数，一个 N 极和一个 S 极组成一对磁极，因此：

$$
p=\frac{P}{2}
$$

例如，14 极电机的极对数为 7。可用限流直流电源给任意两相通入小电流，缓慢转动电机并记录一圈内的稳定吸合位置数量，作为极对数的初步判断；更可靠的方法是观察转子旋转一圈时反电动势的电周期数。

![image-20251031235035195](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251031235035195.png)

**槽数：** 定子槽用于放置绕组。槽数是定子铁芯槽的数量，不一定等同于独立线圈的数量。

![image-20251031235327179](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251031235327179.png)

**相电阻：** 指单相绕组的电阻，单位为 Ω。对于常见的星形（Y）接法，直接测得的任意两相端子间电阻是线电阻；忽略中性点接触电阻且三相对称时，线电阻约为单相电阻的两倍。

**绕组极性：** 相邻线圈的绕向和接线方式共同决定磁极方向，必须按照既定绕组拓扑连接，不能简单概括为所有相邻线圈极性都相反。

![image-20251101000138850](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101000138850.png)

**绕组接法**

![image-20251101000516719](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101000516719.png)

### 2.2 2804 无刷电机

![image-20251012013337580](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012013337580.png)

![image-20251012013440435](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012013440435.png)

![image-20251012014510130](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012014510130.png)

![image-20251012014551835](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012014551835.png)

![image-20251012014617412](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012014617412.png)

#### 2.2.1 参数

| 参数 | 数值 |
|---|---:|
| 电机直径 | 33.6 mm |
| 电机厚度 | 20.0 mm |
| 磁环内径 | 3.0 mm |
| 接口线长 | SH1.0 引脚，55 mm |
| 重量 | 34 g |
| 工作电压 | DC 5–24 V |
| 电流 | 550 mA（12 V） |
| 转速 | 3840 rpm |
| KV 值 | 320 rpm/V |
| 扭矩 | 0.05 N·m |
| 极对数 | 7 |
| 相电阻 | 2.5 Ω |
| 螺纹孔 | M2.5 |

### 2.3 DJI 2312S

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/11c7d48a2a104a488f4654053810cc18-1761922084793-7.jpg)

适用机型：精灵 4 / 精灵 4 Pro。

#### 2.3.1 参数

- 单电机悬停功率：36 W
- 最大功率：202.8 W
- 单电机额定工作电流：2.5 A
- 额定工作电压：14.4 V
- 最高转速：8500 rpm
- KV 值：800 rpm/V
- 电机重量：53 g

实测记录：使用 12 V 无刷电调时，空载转速约为 10000 rpm。是否可直接使用 4S（14.8 V）电池，还需结合电机和电调的额定电压、负载及散热条件确认。

- 安装孔距：18 mm。
- 螺纹规格：M3。

#### 2.3.2 尺寸与结构

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/o1cn01j2b2uv1wgorl2prbr656126337.jpg)

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/o1cn01hqsgsy1wgorstzpsx656126337.jpg)

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/o1cn01sm8o9q1wgorqypnom656126337.jpg)

- 高度记录：4 mm（其中 0.8 mm 的含义待核对）。
- 螺丝孔尺寸记录：2 mm + 4 mm × 1.2 mm（待结合结构图核对）。
- 径向磁环：外径 7.7 mm、内径 3 mm；径向磁铁：外径 7 mm、内径 3 mm、高 3 mm。
- [嘉立创开源硬件平台项目](https://x.jlc.com/platform/detail/d30b06ac671844608804d97155a2ef89)

**DJI 2312S 电机解剖图**

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/173624m4iigie4v4r9knav.jpeg)

| **参数**         | **数值** | **说明**                                             |
| ---------------- | -------- | ---------------------------------------------------- |
| **定子槽数 (N)** | 12       | 决定了绕线方式和扭矩平稳性                           |
| **磁极数（P）**  | 14       | 用于确定电角度与机械角度的关系                       |
| **极对数（p）**  | 7        | 机械转速 = 电角频率对应转速 ÷ 7                      |
| **结构类型**     | 外转子   | 壳体带动输出轴转动，惯量大，动力输出稳               |

### 2.4 航模无刷电机

![6e191de3a396569b19408dc913bb064](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/6e191de3a396569b19408dc913bb064.jpg)

![415eeebfcf25e604fbc0200f09ce51a](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/415eeebfcf25e604fbc0200f09ce51a.jpg)

![9376807af47e9b94154da60686de8e8](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/9376807af47e9b94154da60686de8e8.jpg)

### 2.5 制动与能量回馈

电机减速时会进入发电状态，将机械能回馈到直流母线（DC Bus）。若电源不能吸收回馈能量，母线电容电压会升高，轻则触发过压保护，重则损坏 MOSFET、IGBT 或母线电容。

常见处理方式包括：

- **能量回馈：** 将电能送回可吸收能量的电池或前端电源，需要电源和保护电路支持反向电流。
- **电阻制动：** 当 $V_{bus}$ 超过设定阈值时，导通制动 MOSFET，使电流流过铝壳电阻或水泥电阻，将能量转换为热量。
- **短路制动：** 导通同一侧的三个桥臂，将三相端子等效短接，通过绕组电阻消耗能量。高速时短路电流可能很大，必须限流并评估电机温升。
- **反向制动：** 施加反向转矩主动减速。控制不当会产生较大的母线回馈和相电流。

下图电路中，Q8 用于隔离电源与电机侧母线；Q1～Q6 关闭后，其体二极管构成三相整流通路。电机产生的交流电经整流和母线电容滤波后，在 Q7 导通时流过制动电阻。制动结束后关闭 Q7，再按系统时序恢复 Q8 和逆变桥。

![原理图](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/184ad0ca89bf4313e85d4d022e875a71.png)

> 小功率系统可以只采用绕组短路制动，但仍需评估峰值电流和温升。不能在未验证的情况下直接删去母线电容；母线电容同时承担 PWM 脉动电流的去耦作用。

**单 MOSFET 低端制动支路示意：**

```text
DC+ ────────────────┐
                    │
                 制动 MOS
                    │
               制动电阻
                    │
DC- (GND) ──────────┘
```

![image-20260106012101988](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260106012101988.png)

制动电阻应选择具有足够脉冲功率、平均功率和耐压裕量的功率电阻，常见形式为铝壳电阻或水泥电阻。若电阻绕线带来明显寄生电感，吸收或钳位网络应按照实际开关波形设计，不能仅凭经验并联二极管。

**双 MOSFET 制动支路示意：**

```text
DC+ ── MOS1 ──┐
              │
           制动电阻
              │
DC- ── MOS2 ──┘
```

双 MOSFET 可用于实现冗余关断或双向隔离，但只有在驱动、电流路径和故障检测都正确设计时才具备安全收益。正常运行或待机时两管关断；制动时可保持一管导通，并对另一管进行 PWM 斩波，以调节制动功率。若任一 MOSFET 短路，控制器应检测故障并关断另一只 MOSFET。

MCU 应实时监测 $V_{bus}$，并设置制动开启阈值、关闭阈值和滞回，避免在临界电压附近频繁切换。母线电容用于承受 PWM 脉动电流并暂存制动初期的回馈能量，应靠近功率桥放置。器件选型至少需要校核：

- MOSFET 的耐压、脉冲电流、安全工作区和散热；
- 制动电阻的阻值、峰值功率、平均功率和温升；
- 母线电容的耐压、容量、ESR 和纹波电流；
- 硬件过压保护在 MCU 或软件失效时能否独立关断功率级。

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/hbjdxklrgqzkgpfm3agtalijocuugxacrapk2c04.jpeg)

## 3. 硬件设计

### 3.1 三相逆变器与驱动电路

![image-20260109222531547](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109222531547.png)

三相逆变器通常由 6 个 MOSFET 构成，可采用“上 N 下 N”或“上 P 下 N”等结构。逆变器将直流母线电压调制为三相交流电压，通过改变电压矢量的幅值和频率控制电机运行。

![image-20260111153043445](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111153043445.png)

下图示意无源二极管前端、直流链路电容、两电平逆变器和电机等效负载；实际功率管还包含反并联体二极管，并受到电机反电动势影响。

![The schematics of a two-level inverter with passive diode front-end, DC-link capacitor and a motor equivalent connected. Snubbers and anti-parallel diodes are not shown.](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-asset.webp)

**无刷电机驱动系统的基本构成：**

1. 电机本体；
2. 位置传感器或位置观测器，用于获得转子位置；
3. 控制与驱动电路，通常包含 MCU、栅极驱动器和三相逆变器。

控制器利用转子位置检测装置检测转子位置，根据获得的转子位置信号管理电子换相电路，按照一定规律改变逆变电路中电子开关器件的开关状态，从而驱动电机运转。

**逆变电路**将直流电转换为幅值、频率和相位可控的交流电。

单个半桥由上、下两个 MOSFET 组成，中点作为一相输出：

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/v2-da584b1612f491b1d90e97d320ccdd571440w.jpg)

三个半桥组成三相逆变器，每个半桥的中点分别连接电机 U、V、W 三相。

MCU 通常输出 6 路 PWM，即 3 对带死区的互补信号。STM32 高级控制定时器可直接生成互补 PWM，并提供死区和刹车功能。

![image-20251101013024942](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101013024942.png)

同一半桥的上、下管不得同时导通，否则会造成直通短路。两管同时关断时，该相处于高阻状态；这在六步换相、故障关断和死区期间都是正常状态。

### 3.2 MOSFET

#### 3.2.1 导通条件

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/22e26add55da2a09c803a6ed67ee4777.png)

NMOS：当 $V_{GS}$ 高于阈值电压 $V_{th}$ 时开始导通。

PMOS：当 $V_{GS}$ 低于负向阈值时开始导通。

![image-20260109064528697](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109064528697.png)

> $V_{th}$ 只表示器件刚开始导通，并不代表已达到低导通电阻。栅极驱动电压应依据数据手册中指定的 $R_{DS(on)}$ 测试条件选择。

#### 3.2.2 关键参数

![image-20251101013333302](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101013333302.png)

IRFS3607PbF：最大漏源电压 75 V，导通电阻约 7.34 mΩ，标称连续漏极电流 80 A；实际允许电流还受封装、PCB 铜厚和散热条件限制。

MOSFET 的开关过程包括传播延迟和上升/下降时间，直接影响开关损耗、PWM 频率和死区时间。切换同一桥臂时，必须先确认当前器件已可靠关断，再导通另一器件；死区时间应覆盖 MOSFET 和驱动器的最坏情况延迟，并保留适当裕量。

![image-20251101013450045](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101013450045.png)

选型时应以器件数据手册为准，重点核对 $V_{DS}$、$R_{DS(on)}$、栅极电荷、开关时间、安全工作区和热阻。

#### 3.2.3 常见器件

| 型号 | 类型 | 耐压 | 导通电阻 / 电流记录 | 备注 |
|---|---|---:|---|---|
| IRF7480 | N 沟道 MOSFET | 待核对 | 待核对 | 以数据手册为准 |
| NTMFS5C430NLT1G | N 沟道 MOSFET | 40 V | 1.4 mΩ / 200 A | 标称值 |
| NTMFS5C628NLT1G | N 沟道 MOSFET | 60 V | 2.4 mΩ / 150 A | 标称值 |
| **NTMFS5C410NT1G** | N 沟道 MOSFET | 40 V | 0.92 mΩ / 300 A | 当前优先考虑 |
| NTMFS4935NT1G | N 沟道 MOSFET | 30 V | 93 A | 标称值 |
| ISG3201 | GaN 半桥 | 100 V | 3.2 mΩ（记录值） | 参数待核对 |

### 3.3 栅极驱动器

#### 3.3.1 MOSFET 排布

- 上 N-MOS + 下 N-MOS：高边栅极需要相对源极高约 10 V，通常采用自举或电荷泵驱动，如 DRV8301、DRV8323、IR2101、HIP4086。
- 上 P-MOS + 下 N-MOS：高边 PMOS 的源极连接 VBUS，将栅极拉低即可导通；适合较低电压和功率等级。

![image-20260109061729107](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109061729107.png)

在双 NMOS 结构中，高边管的源极随相线电压浮动，因此其栅极驱动电压必须高于相线电压。自举电容建立浮动电源，使 $V_G \approx V_S + 10\text{ V}$。

栅极串联电阻记录值：22 Ω；最终阻值需结合驱动峰值电流、开关速度、振铃和 EMI 调整。

AP50G04GD（TO-252-4L，P+N）：记录参数为 $V_{DS}=-40\text{ V}$、$I_D=-48\text{ A}$、$R_{DS(on)}<16\text{ mΩ}$（$V_{GS}=-10\text{ V}$，典型值 11 mΩ）。

参考工程：[CW32L010 BLDC 电调驱动](https://oshwhub.com/beauty_light/cw32l010-bldc-esc-driver)

#### 3.3.2 自举电路

[MPS电源小课堂第二季：DCDC的高端NMOS的自举秘诀](https://www.bilibili.com/video/BV1kS4y1X7ee/?share_source=copy_web&vd_source=09f14fdf84ff6c72a299be3f314a768e)

![image-20260109210243500](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109210243500.png)

自举电路由自举二极管、自举电容和高边驱动器组成。

![image-20260109214849752](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109214849752.png)

下管导通、上管关断时，相线接近地，VCC 通过自举二极管给 $C_{BOOT}$ 充电。上管需要导通时，驱动器以相线为浮动参考，将自举电容电压叠加到相线电压上，使高边栅源电压达到所需值。

#### 3.3.3 自举注意事项

由于高边驱动采用自举供电方式，自举电容的储能有限，无法长时间维持上桥臂导通。
当上桥臂导通后，自举电容不再充电，其电压会随着驱动器静态电流、漏电流和 MOSFET 栅极电荷的消耗而下降，最终可能触发欠压锁定（UVLO）。

高边允许连续导通的时间不能固定写成某个范围，应根据 $C_{BOOT}$、总栅极电荷、驱动器静态电流、漏电流和 UVLO 阈值计算。采用纯自举供电时占空比通常不能长期保持 100%，必须周期性提供低边导通或相线拉低的充电窗口。

#### 3.3.4 常见驱动芯片

| 类型 | 常见型号 |
|---|---|
| 三相驱动 / 控制器 | DRV8313、DRV8301、FD6288T/Q、EG2133 |
| 双路或半桥驱动 | EG2132 |
| 单路驱动 | EG2131、EG3112、IR2110S |

##### 3.3.4.1 通用特性

- 部分器件集成固定或可配置死区，具体数值以数据手册为准。
- 栅极驱动电源常见为 10 V、12 V 或 15 V，应与 MOSFET 的推荐 $V_{GS}$ 匹配。
- 输出能力应区分峰值拉电流和灌电流，并结合 MOSFET 栅极电荷计算开关时间。
- 欠压锁定会在驱动电压不足时关断输出，避免 MOSFET 因栅压不足而处于高阻导通状态。

#### 3.3.5 DRV8313

- 具备低侧电流感测的引脚
- 最大 2.5 A 峰值电流或 1.75 A 均方根（RMS）输出电流（24 V、25 °C 条件下）。
- 内置 3.3 V、10 mA LDO，可为小功耗外设供电。
- 工作电压：8～60 V。

##### 3.3.5.1 引脚定义

![截屏_2025-10-12_00-08-37](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/2025-10-1200-08-37.png)

| PinName             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| CP1、CP2            | 电荷泵引脚，接一个 0.01 µF / 100 V 电容                      |
| GND                 | 地                                                           |
| V3P3OUT             | 3.3 V 内部 LDO 输出，用 0.47 µF / 6.4 V 陶瓷电容旁路，可给外设供电 |
| VM                  | 电源输入，8.2 V–60 V；用 ≥ 10 µF 电容旁路                   |
| EN1、EN2、EN3       | 高电平使能，内部下拉                                         |
| IN1、IN2、IN3       | 逻辑输入，控制半桥 1/2/3 的开关状态，内部下拉                |
| nRESET              | 低电平有效复位，初始化内部逻辑并禁用输出，内部下拉           |
| nFAULT              | 开漏故障指示，出现故障时拉低                                 |
| COMPN               | 比较器负极输入                                               |
| COMPP               | 比较器正极输入                                               |
| nCOMPO              | 开漏输出，比较器输出                                         |
| OUT1、OUT2、OUT3    | 负载（三相电机）的三端                                       |
| PGND1、PGND2、PGND3 | 功率地；可直接接地，也可串电流检测电阻后接地                 |

##### 3.3.5.2 nRESET 和 nSLEEP

- **nRESET：** 低电平有效复位，重置内部逻辑、清除故障并禁用输出。
- **nSLEEP：** 低电平进入低功耗睡眠，禁用输出和电荷泵，重置内部逻辑并停止内部时钟；退出睡眠后通常需要约 1 ms 才能重新驱动。

##### 3.3.5.3 半桥控制

![RealValueTable](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/2b43801d0d7b7c60d5e7bbc0ae74c9be.png)
![three-Phase Motor Signals](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/494f38dbd4dbd200b7f249ce75de445b.png)

> 由于 DRV8313 使用 NMOS，高边栅极电压必须高于 VM，因此芯片内部使用电荷泵；nSLEEP 有效时电荷泵关闭。

#### 3.3.6 DRV8301

DRV8301 可通过 DTC 引脚外接电阻设置死区时间。工程上推荐使用 6PWM 模式，配置直观，死区时间也便于调整。死区时间至少应覆盖 MOSFET 关断时间和 MCU 输出延迟，并留出裕量。

#### 3.3.7 IR2104 半桥驱动器

IR2104 带有 SD（Shutdown）引脚，拉低即可切断输出，可作为硬件过流/过压保护和软件软关断接口。

#### 3.3.8 其它电机控制器记录

峰岹 FU6812L2 集成电机控制引擎和 8051 内核，硬件包含 FOC、MDU、LPF、PID、SVPWM 等模块，可用于有感或无感 BLDC/PMSM 控制。

### 3.4 电流采集概览

> 本节保留总览和器件选型；采样窗口、ADC 同步、OPAMP/PGA、量程计算及软件重构详见[电流采集与重构专题文章](/posts/foc-current-sensing/)。

#### 3.4.1 方案对比

| 方案 | 采样位置 | 优点 | 局限 |
|---|---|---|---|
| 高边采样 | 上桥 MOSFET 与电机相线之间 | PWM 任意时刻都可测量，也能检测部分对地短路 | 共模电压高，需要 INA240、AD8418 等专用放大器 |
| 低边采样 | 下桥 MOSFET 与功率地之间 | 共模接近地，普通运放即可，成本低 | 只有下管导通窗口有效，受占空比和采样时序限制 |
| 单电阻采样 | 直流母线或三相下桥公共支路 | 器件少 | 依赖开关状态重构，算法和采样窗口更复杂 |
| 双/三电阻采样 | 两相或三相下桥分别串联 | 重构简单，三电阻最直观 | 器件和 ADC 通道更多 |

![高边采样](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112025602736.png)
![低边采样](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112025520414.png)
![单电阻采样](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112031908397.png)
![双电阻采样](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112032059795.png)
![三电阻采样](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112031747921.png)

#### 3.4.2 INA240

INA240 是带 PWM 抑制的双向电流检测放大器，主要参数记录如下：

- 共模输入范围：约 −4 V 至 80 V。
- 供电范围：2.7 V 至 5.5 V。
- 可选增益：INA240A1 为 20 V/V、A2 为 50 V/V、A3 为 100 V/V、A4 为 200 V/V。
- REF1/REF2 用于设置单向或双向测量的输出偏置。

![INA240](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/6543d22e311f4581a07e3f9e2d14718a3494354343693013png1192w.webp)
![INA240 引脚](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251011235604533.png)
![双向电流测量](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012124050140.png)
![INA240 输出关系](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012122047025.png)

单电源双向测量时，可将零电流输出偏置在电源电压中点。以 3.3 V、10 mΩ 分流电阻为例，理论量程还需结合增益和输出摆幅计算，不能只按电源电压简单相除。

##### 3.4.2.1 典型应用

![INA240 典型应用](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251011235157464.png)
![采样电阻连接](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012124518205.png)
![开尔文连接](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012124559799.png)

#### 3.4.3 电流检测运放

可选器件包括 AD8418 等电流检测放大器。采样电阻应采用开尔文连接，功率回路和信号回路分开布线。

![AD8418](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109065358053.png)

### 3.5 角度传感器

#### 3.5.1 磁编码器

- **增量式：** 输出 ABZ/ABI 正交脉冲，也可使用霍尔 UVW。
- **绝对式：** 直接输出角度数据，常见接口为 I²C、SPI、SSI 或 PWM。

#### 3.5.2 安装

![磁编码器安装](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/e76f0dbd83870b4c102764796fcb41d.jpg)

#### 3.5.3 型号

![磁编码器结构](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/db0e7b3c0d8bbcf83bd17ef0f3481c9.jpg)

| 型号 | 接口 / 输出 | 分辨率 | 特点 | 适用场景 |
|---|---|:---:|---|---|
| **AS5600** | I²C（地址 0x36） | 12 bit | 便宜易用，但速度较低 | 低速或成本敏感应用 |
| **AS5047P** | SPI、ABI | 14 bit | 绝对角度、动态角度误差补偿、低延迟 | 高速高精度应用 |
| **MT6701** | ABZ / UVW / PWM / 模拟 / I²C / SSI | 14 bit | 接口丰富，电路简单 | 通用绝对角度应用 |
| **TLE5012B** | SPI | 16 bit | 高精度，支持角度预测 | 高精度测量 |
| **MA730 / MT6835** | SPI | 视型号而定 | 可作为高速绝对角度方案 | 需要结合实际延迟选型 |

当前记录优先考虑 AS5047P。

#### 3.5.4 接口与信号

**ABI / ABZ：** A、B 两路相差 90°，根据超前关系判断方向；Z 相每转输出一个参考脉冲。

- 14 位绝对角度：16384 个位置。
- 12 位绝对角度：4096 个位置。
- 1024 PPR 的增量编码器使用四倍频时为 4096 CPR。

![ABI / ABZ 信号](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251114235723747.png)

**UVW：** 霍尔位置传感器通过三个数字信号表示转子所在的六个有效区间，每个状态约对应 60° 电角度。

![UVW 霍尔信号](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251114235801429.png)

#### 3.5.5 原理图

![编码器原理图](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/236686f40de56b698962a013c6a6d3f.jpg)

主要使用 ABZ 和 SPI 接口。编码器校准和电角度偏移量计算将在编码器校准专题文章中整理。

### 3.6 板级接口

本节待结合最终 PCB 原理图补充接口定义。当前项目记录包含 CAN、USART、USB、XT60、电机三相接口以及编码器接口。

### 3.7 MCU 选型

优先考虑 STM32G4 系列，用于 BLDC/PMSM 的 PWM、ADC、OPAMP、比较器和电机控制运算。

![STM32G4 选型参考](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109203821786.png)

当前记录：

- STM32G431CB / STM32G431 系列。
- STM32G474 作为更高性能候选。
- STM32F405 作为已有 VESC 类项目的参考平台。
- STM32G431B-ESC1 可用于验证三相逆变器和电机控制流程。

### 3.8 其它硬件

#### 3.8.1 隔离

高速光耦可选 TLP715，用于 MCU 与栅极驱动器之间的隔离。

#### 3.8.2 接口

##### 3.8.2.1 电源

| 型号 | 针脚间距 | 常见电流/电压 | 备注 |
|---|---:|---|---|
| **KF635** | 6.35 mm | 约 23–30 A，300–750 V | 小体积、中等电流 |
| **KF7620** | 7.62 mm | 约 30 A | 通用型 |
| **KF950** | 9.5 mm | 约 30 A | 适合更粗线缆 |

另有 MT30 等电源接口方案。

##### 3.8.2.2 霍尔传感器接口

霍尔输入需要上拉电阻；1N4148 可用于将输入电压钳位在约 4.3 V 以内，满足 STM32 输入耐压要求。

![霍尔传感器接口](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109224719558.png)

#### 3.8.3 母线电容

母线电容用于吸收 PWM 开关电流和制动回馈能量，应靠近功率桥放置，优先选择高频低阻器件。

![母线电容](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109204023915.png)

## 4. 电机控制基础

### 4.1 理论基础

电机切向存在受力，电机就会旋转；定子电流产生磁场，转子永磁体在磁场作用下跟随并产生转矩。

![电机受力基础](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109055208212.png)

#### 4.1.1 驱动方式

- 方波驱动：六步换相。
- 正弦波控制：SPWM 或 SVPWM。
- FOC：
  - 有感：使用霍尔或编码器获得位置。
  - 无感：使用反电动势、高频注入、磁链观测器或滑模观测器。

## 5. 方波与六步换相

六步换相是一种实现简单的 BLDC 控制方法。

### 5.1 导通方式

- **两两导通：** 两个功率管导通，两相绕组有电流，第三相悬空。
- **三三导通：** 开关管在一个周期内导通 180° 电角度，每 60° 换相一次，三相绕组同时有电流。

三三导通利用率较高，但开关规则更复杂；工程中常采用两两导通。

### 5.2 安培定则

右手螺旋定则描述电流与磁场方向的关系：四指指向电流方向，大拇指所指方向为线圈 N 极。

![安培定则](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109231323639.png)

磁体之间遵循异性相吸、同性相斥。

### 5.3 磁场矢量

三相电流合成一个定子磁场矢量，转子永磁体会跟随该磁场方向运动。

![磁场矢量](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109231714987.png)

### 5.4 六步换相

#### 5.4.1 三三导通

![三三导通](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251012163018648.png)

#### 5.4.2 两两导通

![两两导通](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109230829324.png)

每次换相 60°：

1. A 接电源，B 悬空，C 接地。
2. A 接电源，B 接地，C 悬空。
3. A 悬空，B 接地，C 接电源。
4. A 接地，B 悬空，C 接电源。
5. A 接地，B 接电源，C 悬空。
6. A 悬空，B 接电源，C 接地。

顺序反转，电机方向也会反转。若转子无法及时跟随定子磁场，就会丢步，可适当增加电流或降低换相速度。

![六步换相](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111153140650.png)

### 5.5 软件实现

六步换相的软件表和换相保护逻辑待结合具体霍尔相序补充。

## 6. FOC 概览

FOC（Field Oriented Control，磁场定向控制）也称矢量控制，通过坐标变换将三相交流量转换为与转子同步的直流量，从而实现平滑、精确的转矩和速度控制。

### 6.1 驱动原理

获得转子电角度后，通过 SVPWM 让定子合成磁场按照目标方向旋转，并使转矩分量保持稳定。

![FOC 驱动原理](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260109070015576.png)

- 位置传感器：霍尔、编码器。
- 无位置传感器：通过反电动势、相电流和观测器估算转子位置。

#### 6.1.1 无传感器方案

无感控制常见方法包括反电动势过零、续流二极管检测、电感法、磁链观测器、滑模观测器和高频注入。

反电动势法通过检测非导通相的反电动势过零点，延迟约 30° 电角度得到换相点。实现时要处理虚拟中性点、PWM 脉动、滤波延迟以及续流干扰。

![无感观测器](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101115511218.png)

无感 FOC 的基本流程：

1. 采集两相或三相电流。
2. Clarke 变换得到 $i_\alpha、i_\beta$。
3. Park 变换得到 $i_d、i_q$。
4. 通过 PI 比较目标值和反馈值。
5. 得到 $v_d、v_q$，反 Park 后得到 $v_\alpha、v_\beta$。
6. 通过 SVPWM 生成三相 PWM。

## 7. 坐标变换与矢量控制

矢量控制同时控制电流的大小和方向。Clarke 变换负责降维，Park 变换负责把交流量变成同步坐标系中的直流量。

![矢量控制框图](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112024709950.png)

### 7.1 Clarke 变换

Clarke 变换将三相静止坐标系 abc 转换为两相正交静止坐标系 $\alpha\beta$。

![Clarke 变换](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111152732114.png)
![Clarke 投影](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/31-3.png)

#### 7.1.1 变换步骤

1. 将三相、相差 120° 的正弦量抽象为三个空间矢量。
2. 将三个矢量投影到相差 90° 的 $\alpha$、$\beta$ 轴。
3. 利用三相电流和为零，减少一个独立变量。

#### 7.1.2 投影过程

![Clarke 投影过程](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112022450556.png)

三相对称电流可写为：

$$
\begin{cases}
i_a=I_m\cos\omega t\\
i_b=I_m\cos(\omega t-\frac{2\pi}{3})\\
i_c=I_m\cos(\omega t+\frac{2\pi}{3})
\end{cases}
$$

等幅值 Clarke 变换：

$$
\begin{bmatrix}i_\alpha\\i_\beta\end{bmatrix}
=\frac{2}{3}
\begin{bmatrix}
1&-\frac12&-\frac12\\
0&\frac{\sqrt3}{2}&-\frac{\sqrt3}{2}
\end{bmatrix}
\begin{bmatrix}i_a\\i_b\\i_c\end{bmatrix}
$$

当 $i_a+i_b+i_c=0$ 时，常用两相形式为：

$$
i_\alpha=i_a,\qquad
i_\beta=\frac{i_a+2i_b}{\sqrt3}
$$

#### 7.1.3 正变换公式

$$
\begin{cases}
i_\alpha=i_a\\
i_\beta=\frac{1}{\sqrt3}(i_a+2i_b)
\end{cases}
$$

只采两相即可通过 KCL 重构第三相，因此可以减少一路电流传感器。

#### 7.1.4 逆 Clarke 变换

$$
\begin{cases}
i_a=i_\alpha\\
i_b=\frac{-i_\alpha+\sqrt3i_\beta}{2}\\
i_c=\frac{-i_\alpha-\sqrt3i_\beta}{2}
\end{cases}
$$

### 7.2 Park 变换

Park 变换把固定的 $\alpha\beta$ 坐标系旋转到与转子同步的 $dq$ 坐标系，使交流量变成近似直流量。

![Park 变换](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/33-1.png)
![dq 坐标系](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/33-2.png)
![旋转矩阵](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111225349076.png)

$$
\begin{bmatrix}i_d\\i_q\end{bmatrix}
=
\begin{bmatrix}
\cos\theta&\sin\theta\\
-\sin\theta&\cos\theta
\end{bmatrix}
\begin{bmatrix}i_\alpha\\i_\beta\end{bmatrix}
$$

$$
\begin{cases}
i_d=i_\alpha\cos\theta+i_\beta\sin\theta\\
i_q=-i_\alpha\sin\theta+i_\beta\cos\theta
\end{cases}
$$

逆 Park 变换：

$$
i_\alpha=i_d\cos\theta-i_q\sin\theta,\qquad
i_\beta=i_q\cos\theta+i_d\sin\theta
$$

- $i_d$：转子磁极方向的励磁分量。常规 PMSM/BLDC 控制中通常令 $i_d\approx0$。
- $i_q$：垂直于磁极方向的转矩分量，主要决定电机转矩。

![d/q 电流分量](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112033141587.png)

#### 7.2.1 总结

FOC 的基本控制链路是：

~~~text
采集相电流
  -> Clarke
  -> Park
  -> Id/Iq PI
  -> 反 Park
  -> SVPWM
  -> 三相 PWM
~~~

![坐标变换过程](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/videotop02-soconvert.webp)

### 7.3 SPWM

SPWM 通过三相正弦参考波与载波比较产生 PWM。

#### 7.3.1 SPWM 的生成

参考波相差 120°，通过改变正弦波的幅值控制电压，通过改变频率控制旋转磁场速度。

#### 7.3.2 电机驱动

SPWM 实现简单，但直流母线电压利用率低于 SVPWM，适合原理验证和低复杂度应用。

#### 7.3.3 软件实现

可以先完成逆 Clarke，将 $\alpha\beta$ 电压转换为 abc，再将三相电压映射到 PWM 比较值。实际使用时需要限幅到 [0, PWM_CNT]。

## 8. SVPWM

SVPWM 将三相逆变器的八种开关状态表示为六个非零基本电压矢量和两个零矢量，通过相邻矢量的时间组合合成参考电压矢量。

### 8.1 简介

六个非零矢量间隔 60°，把电压平面划分为六个扇区。零矢量为 000 和 111。

### 8.2 扇区与基本矢量

相邻的两个非零矢量与零矢量共同作用，满足伏秒平衡：

$$
\vec U_{ref}T_s=\vec V_1T_1+\vec V_2T_2+\vec V_0T_0
$$

### 8.3 矢量圆

![SVPWM 矢量圆](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112045644311.png)

### 8.4 电压分析

标准两电平逆变器的非零基本矢量幅值通常为：

$$
|V_1|=|V_2|=\frac{2}{3}U_{dc}
$$

### 8.5 开关状态组合

六个有效状态为 100、110、010、011、001、101；000 和 111 为零矢量。相邻矢量切换时尽量只改变一相开关状态，降低谐波和开关损耗。

### 8.6 基础矢量合成

以扇区 I 为例，使用 0° 的 $V_1$ 和 60° 的 $V_2$：

$$
\begin{cases}
U_\alpha T_s=\frac23U_{dc}T_1+\frac13U_{dc}T_2\\
U_\beta T_s=\frac{\sqrt3}{3}U_{dc}T_2
\end{cases}
$$

因此：

$$
T_2=\frac{\sqrt3U_\beta T_s}{U_{dc}}
$$

$$
T_1=\frac{3U_\alpha T_s-\sqrt3U_\beta T_s}{2U_{dc}}
$$

![扇区 I 作用时间](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112142518741.png)

### 8.7 全空间矢量计算

定义：

$$
K=\frac{\sqrt3T_s}{U_{dc}},\qquad
U_x=U_\beta,\quad
U_y=\frac{\sqrt3}{2}U_\alpha-\frac12U_\beta,\quad
U_z=\frac{\sqrt3}{2}U_\alpha+\frac12U_\beta
$$

| 扇区 | 有效矢量作用时间 |
|:---:|---|
| 1 | $T_x=K U_y,\ T_y=K U_x$ |
| 2 | $T_x=-K U_y,\ T_y=K U_z$ |
| 3 | $T_x=K U_x,\ T_y=-K U_z$ |
| 4 | $T_x=-K U_x,\ T_y=-K U_y$ |
| 5 | $T_x=-K U_z,\ T_y=K U_y$ |
| 6 | $T_x=K U_z,\ T_y=-K U_x$ |

零矢量时间：

$$
T_0=T_7=\frac12(T_s-T_x-T_y)
$$

### 8.8 扇区判断

通过比较三个量的符号，避免使用反正切：

$$
U_1=U_\beta,\qquad
U_2=\sqrt3U_\alpha-U_\beta,\qquad
U_3=-\sqrt3U_\alpha-U_\beta
$$

令：

$$
N=A+2B+4C
$$

其中 A、B、C 分别表示 $U_1、U_2、U_3$ 是否大于 0。

| 扇区 | N |
|:---:|---:|
| I | 3 |
| II | 1 |
| III | 5 |
| IV | 4 |
| V | 6 |
| VI | 2 |

![扇区判断](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/untitled.jpg)
![扇区编码](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112050150435.png)
![扇区映射](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112050738985.png)

#### 8.8.1 代码实践

~~~c
float u1 =  v_beta;
float u2 =  1.73205078F * v_alpha - v_beta;
float u3 = -1.73205078F * v_alpha - v_beta;

uint32_t sector_code = (u1 > 0.0F)
                     | ((u2 > 0.0F) << 1)
                     | ((u3 > 0.0F) << 2);

// 将符号编码 N 映射为物理扇区编号 1～6。
static const uint8_t sector_lut[8] = {0, 2, 6, 1, 4, 3, 5, 0};
uint32_t sector = sector_lut[sector_code];
~~~

### 8.9 矢量作用时间

以定时器计数值代替实际时间：

~~~c
float k = Ts_cnt / Udc;

switch (sector) {
case 1:
    T1 = ( 1.5f * Ualpha - 0.8660254f * Ubeta) * k;
    T2 = ( 1.7320508f * Ubeta) * k;
    break;
case 2:
    T1 = (-1.5f * Ualpha + 0.8660254f * Ubeta) * k;
    T2 = ( 1.5f * Ualpha + 0.8660254f * Ubeta) * k;
    break;
default:
    // 其它扇区按查表公式计算
    break;
}
~~~

计算后应限制 $T_1+T_2\le T_s$，避免过调制。

### 8.10 算法流程总结

1. 输入 $U_\alpha、U_\beta$。
2. 计算 $U_x、U_y、U_z$。
3. 通过符号比较判断扇区。
4. 查表得到两个有效矢量的作用时间。
5. 计算零矢量时间并映射到 CCR。
6. 输出三相互补 PWM。

### 8.11 七段式 SVPWM

七段式 SVPWM 通过对称分配零矢量降低谐波。扇区 I 的典型顺序为：

$$
000\rightarrow100\rightarrow110\rightarrow111\rightarrow110\rightarrow100\rightarrow000
$$

![七段式波形](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260215133735513.png)
![七段式 PWM](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260215151255770.png)
![中心对齐波形](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260215151515074.png)
![七段式切换记录 1](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112162939961.png)
![七段式切换记录 2](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112162952241.png)
![七段式切换记录 3](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112162901149.png)
![七段式切换记录 4](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112162917813.png)
![七段式切换记录 5](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112163021772.png)
![七段式切换记录 6](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260112163033172.png)
![七段式动画](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/bb5424eeb54c6404e5ee4377d2f3ab27.gif)

#### 8.11.1 核心参数定义

- $T_x、T_y$：当前扇区两个有效矢量的作用时间。
- $T_0(000)、T_7(111)$：两个零矢量的作用时间。

#### 8.11.2 比较寄存器（CCR）值的确定

在 PWM 模式 2 下，可以按零矢量和两个有效矢量的半周期时间依次计算 CCR1、CCR2、CCR3。实际极性和计数方向必须结合驱动器时序图确认。

### 8.12 工程代码实践

#### 8.12.1 VOFA+ 波形输出

使用 VOFA+ JustFloat 模式发送电角度、DQ 电压、$\alpha\beta$ 电压和三相 PWM 量，便于观察坐标变换和调制结果。

![VOFA+ 波形](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/shot.png)

推荐的数学运算顺序如下：

~~~c
void clarke_transform(const abc_t *abc, ab_t *ab)
{
    ab->alpha = abc->a;
    ab->beta = (abc->a + 2.0f * abc->b) * INV_SQRT_3;
}

void park_transform(const ab_t *ab, float theta, dq_t *dq)
{
    float s = arm_sin_f32(theta);
    float c = arm_cos_f32(theta);
    dq->d = ab->alpha * c + ab->beta * s;
    dq->q = -ab->alpha * s + ab->beta * c;
}

void inverse_park_transform(const dq_t *dq, float theta, ab_t *ab)
{
    float s = arm_sin_f32(theta);
    float c = arm_cos_f32(theta);
    ab->alpha = dq->d * c - dq->q * s;
    ab->beta = dq->d * s + dq->q * c;
}
~~~

工程中应让 SVPWM 只计算并返回三路 duty/CCR，硬件层再调用定时器接口写入比较寄存器，这样便于仿真、测试和移植。

## 9. 开环控制

### 9.1 电机参数

#### 9.1.1 极数

极数是转子磁极总数；一个 N 极和一个 S 极组成一对磁极，极对数为极数的一半。

#### 9.1.2 电角度与机械角度

机械角度是转子相对定子的实际旋转角度，范围为 0～360°；电角度与极对数相关：

$$
\theta_e=p\theta_m
$$

#### 9.1.3 电机极对数的判断

1. 用示波器观察电机任意两相反电动势，转子转一圈出现的电周期数就是极对数。
2. 两相接受限流直流，用手缓慢转动，感受到的卡顿次数就是极对数。

#### 9.1.4 磁链

磁链为磁通与匝数的乘积：

$$
\lambda=N\Phi
$$

Park 变换中的 dq 坐标系与转子磁链同步旋转，因此稳态下磁链和电流可以表现为近似直流量。

![电角度与机械角度](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/44-1.png)

### 9.2 开环控制代码

开环控制通过生成递增的电角度，强制制造旋转定子磁场，再经反 Park 和 SVPWM 输出。核心数据包括极对数、电角度步进、DQ 电压命令和 PWM 输出。

~~~c
void foc_set_speed_rpm(float rpm)
{
    const float dt = 1.0f / PWM_FREQ_HZ;
    angle_step_rad = 2.0f * PI * (rpm / 60.0f) * pole_pairs * dt;
}

void foc_tim_irq(void)
{
    electrical_angle_rad = limit_angle_rad(
        electrical_angle_rad + angle_step_rad);

    inverse_park_transform(&dq_voltage,
                           electrical_angle_rad,
                           &ab_voltage);
    svpwm_calc(&ab_voltage);
}
~~~

开环电机可能嗡嗡响、振动和发热。速度越高，需要的转矩越大；若电压或转矩不足会失步。调试时应从低速、小电压开始，串口数据上传尽量使用 DMA。

### 9.3 V/F 控制

V/F 控制保持电压和频率的比例近似恒定：

$$
\frac{V}{f}=K
$$

| 要点 | 说明 |
|---|---|
| 频率决定转速 | 旋转磁场的速度由频率决定 |
| 电压决定力矩能力 | 电压过小则难以克服负载和反电动势 |
| 转子跟随 | 转子被旋转磁场拖动，开环下可能失步 |

#### 9.3.1 核心要点

$U_q$ 主要决定转矩能力，不直接决定当前转速。转矩大于负载时加速，等于负载时匀速，小于负载时减速。真正闭环时，应由速度 PI 根据速度误差生成 $I_q$ 或 $U_q$ 给定。

## 10. 闭环控制与编码器校准

### 10.1 初始位置

FOC 初始零位通常定义为：A/U 相轴、$\alpha$ 轴、转子 N 极方向和 d 轴正向重合。

当 $I_d\ne0、I_q=0$ 时，定子产生固定方向的磁场，把转子吸合到 d 轴方向，实现 Rotor Alignment。

![初始位置](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260226171925685.png)

### 10.2 编码器校准

> 完整的电气零点、偏移量定义、ABZ/Z 相流程和当前工程实现记录将在编码器校准专题文章中整理。

- 增量式编码器上电后位置随机，需要预定位或人工对齐。
- 编码器机械零点与电机 d 轴零点通常存在固定偏差。
- 当前工程统一使用极对数、方向和 electrical offset 将机械角度转换为电角度。
- 预定位、低速找 Z、捕获偏移量和 Flash 保存应放在独立的校准状态机中。

![编码器零位示意](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/v2-3d787c2649cfdb1e23c641e5b1945079r.jpg)

校准基本流程：

~~~text
PWM 开启
  -> d 轴注入并锁定转子
  -> 等待稳定
  -> 建立临时编码器参考
  -> 低速旋转寻找 Z
  -> 捕获 Z 时的计数
  -> 计算并保存 electrical offset
~~~

## 11. 软件实现

### 11.1 互补 PWM 输出

#### 11.1.1 概念

高级定时器（如 TIM1、TIM8）可以输出三路互补 PWM，并提供死区和刹车功能。

- 主输出：TIMx_CH1、TIMx_CH2、TIMx_CH3。
- 互补输出：TIMx_CH1N、TIMx_CH2N、TIMx_CH3N。
- 上下管不能同时导通，死区期间两路均关闭。
- 电机控制常用 PWM 频率约 16~20 kHz，FOC 快环通常与 PWM 同步。

![互补 PWM](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/v2-eb9064e2b5aeeaffa7a8021b658a1d221440w.jpg)

#### 11.1.2 CubeMX 配置

以 TIM1 三相互补 PWM 为例：

- CH1：PA8。
- CH2：PA9。
- CH3：PA10。
- 时钟源选择内部时钟。
- CH1、CH2、CH3 均选择互补 PWM。
- 使能 Active Break Input，连接硬件过流/过压保护。

![CubeMX 时钟配置](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260110203218105.png)
![定时器时钟](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/3eee431fd515cb2bc1e277d688af0a9e.png)

#### 11.1.3 定时器模式

![PWM 定时器模式](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251101014357355.png)

推荐中心对齐模式：

- 递增计数：CNT 从 0 计到 ARR。
- 递减计数：CNT 从 ARR 计到 0。
- 中心对齐：递增和递减交替运行，PWM 波形对称，谐波较小。
- CCR 预装载应开启，避免周期中途更新占空比。

#### 11.1.4 定时器配置

![定时器基本配置](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260110232907357.png)

- PSC：根据目标 PWM 频率设置，常用 0。
- Counter Mode：向上计数或中心对齐模式。
- ARR：决定 PWM 周期。
- RCR：若要求每个 PWM 周期触发更新，通常设置为 0。
- Auto-reload preload：开启。
- CH/CHN Polarity：根据栅极驱动器输入极性设置。
- Output compare preload：开启。
- Idle State：根据功率级安全状态设置。

![刹车配置](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260110233655230.png)
![刹车极性](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260110233830051.png)
![PWM 输出配置](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260110233946981.png)

启动三相互补 PWM 的基本代码：

~~~c
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, duty_a);
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_2, duty_b);
__HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_3, duty_c);

HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);
HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_2);
HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_3);

HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_1);
HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_2);
HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_3);
~~~

#### 11.1.5 死区时间计算

先根据定时器时钟和 CKD 得到死区时间基准：

$$
T_{DTS}=\frac{1}{f_{TIM}/CKD}
$$

DTG 编码分为四个区间：

| 区间 | DTG[7:5] | 死区时间 |
|---|---|---|
| 1 | 0xx | DTG × $T_{DTS}$ |
| 2 | 10x | $(64+\mathrm{DTG}[5:0])\times2T_{DTS}$ |
| 3 | 110 | $(32+\mathrm{DTG}[4:0])\times8T_{DTS}$ |
| 4 | 111 | $(32+\mathrm{DTG}[4:0])\times16T_{DTS}$ |

![死区时间配置](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111025911517.png)
![死区时间区间](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111025621677.png)

历史波形记录：

![互补输出波形](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/dstss1.bmp)
![56 µs 死区波形](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/dstss2.bmp)

死区时间应覆盖 MOSFET 关断延迟、驱动器传播延迟和 MCU 输出延迟，同时避免设置过大导致有效占空比损失。

**TIM1 常用中断：**

| 中断 | 触发条件 | 用途 |
|---|---|---|
| Break | 刹车输入有效 | 紧急停机、硬件保护 |
| Update | 计数器溢出/下溢 | FOC 主中断、定时任务、ADC 同步 |
| Trigger/Commutation | 触发或换相事件 | 霍尔换相、六步换相 |
| Capture/Compare | CNT 与 CCR 匹配 | 输出比较、测速或采样触发 |

~~~c
HAL_TIM_Base_Start_IT(&htim1);

void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    if (htim == &htim1) {
        // 读取反馈、执行控制、更新 PWM
    }
}
~~~

#### 11.1.6 刹车功能

高级定时器的 Break 输入可在过流、过压等故障发生时快速关闭 PWM 输出。触发 Break 后，硬件清除 MOE（Main Output Enable）位，主通道 OCx 和互补通道 OCxN 进入预先配置的安全状态。安全状态不一定始终为低电平，必须结合输出极性、OSSI/OSSR 和空闲状态配置确认，确保功率级上下管均关断。

![image-20260111041146612](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111041146612.png)

- **BRK State：** 启用刹车输入。
- **BRK Polarity：** 设置有效电平；应与外部比较器或故障信号的极性一致。

![image-20260111041227148](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260111041227148.png)

- **Automatic Output State（AOE）：** 决定刹车信号解除后是否由硬件自动恢复输出。对安全要求较高的系统，通常由软件确认故障已清除后再重新置位 MOE，而不是自动恢复。
- **Lock Configuration：** 锁定死区、刹车极性、OSSI/OSSR、AOE 等关键配置，防止运行时被意外修改。不同 STM32 系列各锁定级别的具体范围可能不同，应查阅对应参考手册。

> Break 关断属于硬件保护路径，不应依赖普通中断响应。中断主要用于记录故障、上报状态和执行后续恢复流程。

### 11.2 编码器接口与定时器

当前板级复用记录：

| IO    | PB3  | PB4  | PB5  | PB6  | PB7  | PB8  |
| :---- | :--- | :--- | :--- | :--- | :--- | :--- |
| ABI/Z | TXD  | RXD  |      | HA   | HB   | HZ/I |
| SPI   | SCK  | MISO | MOSI | TXD  | RXD  | IO   |
| I2C   | TXD  | RXD  |      | IO   | SDA  | SCL  |

**STM32 定时器编码器模式的本质：**

编码器模式下，定时器由 A、B 两相信号的有效边沿驱动，而不是按内部时钟周期递增，因此本质上是一个硬件位置计数器：

- 每出现一个有效边沿，CNT 自动加 1 或减 1；
- 计数方向由 A、B 两相的超前关系决定；
- ARR 定义计数器的模数，计数器会在 0 与 ARR 之间回绕。

可将 ARR 设置为每圈计数数减 1，使 CNT 直接对应单圈位置；也可设置为 65535，让 16 位定时器自由运行，再用软件差分计算位置增量。后一种方式便于连续测速，但必须正确处理回绕。

#### 11.2.1 ABZ 编码器

| 名称  | 含义         | 实际信号           |
| ----- | ------------ | ------------------ |
| **A** | A 相增量脉冲 | 正交编码信号       |
| **B** | B 相增量脉冲 | 与 A 相相差 90°    |
| **Z** | Zero / Index | 每转一次的参考脉冲 |
| **I** | Index        | Z 相的另一种命名   |

![image-20251114235723747](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20251114235723747.png)

Z 相每转输出一次基准脉冲，通常接入 EXTI 或定时器索引功能。它用于建立机械参考位置或校验计数，不一定要在中断中直接清零；若直接清零会影响速度差分和多圈位置，应结合软件架构选择“清零、锁存或记录偏移量”。A、B 两相的超前关系用于判断正反转。

STM32 定时器常见编码器模式：

| 模式 | 计数边沿 | 方向判断 |
|---|---|---|
| Encoder Mode TI1 | TI1 边沿 | 由 TI2 电平决定 |
| Encoder Mode TI2 | TI2 边沿 | 由 TI1 电平决定 |
| Encoder Mode TI1 and TI2 | TI1、TI2 边沿 | 根据另一相信号自动判断 |

FOC 位置反馈通常选择 **Encoder Mode TI1 and TI2**，充分利用正交编码器的边沿信息。

![STM32 CUBEMX ABZ 编码器 输入_STM32正交解码_03](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/resizemfixedw1184.webp)

在 CubeMX 中将 **Combined Channels** 配置为 **Encoder Mode**。

![st-img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/150412zxr79axyjllsk2ar.jpg)

![img](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/c5181d2d0a1fdd92637fca370d4e8e06.png)

定时器编码器模式读取 A、B 相；Z 相可单独配置为外部中断。以当前 TIM4 引脚记录为例：

| 引脚    | 功能             | TIM4 通道 |
| ------- | ---------------- | --------- |
| **PB6** | TIM4\_CH1 / A 相 | CH1       |
| **PB7** | TIM4\_CH2 / B 相 | CH2       |
| **PB8** | Z / Index         | GPIO EXTI |

当前 CubeMX 策略：**ARR = 65535 自由运行 + Z 相 GPIO 中断 + 软件差分**。

配置步骤：

1. 将 A、B 相分别连接到同一定时器的 CH1 和 CH2；编码器模式不能任意改用 CH3/CH4。
2. 将 Combined Channels 选择为 Encoder Mode，并配置输入滤波和极性。
3. 将 Z 相配置为 GPIO 外部中断；触发边沿和上下拉必须依据编码器数据手册与实测波形确定。
4. 启动编码器接口后，在与 PWM/ADC 同步的控制周期中读取 CNT。

![image-20260221122039985](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260221122039985.png)

选择编码器模式后，无需再把定时器配置为普通内部时钟或输入捕获模式。

![image-20260221122317045](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260221122317045.png)

推荐配置：**Encoder Mode TI1 and TI2**。

![image-20260221123144493](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260221123144493.png)

若编码器标称 1024 PPR，且厂商的 PPR 指每相每圈脉冲周期数，则正交四倍频后通常为 4096 counts/rev。不同厂商对 PPR、CPR 和 LPR 的定义可能不同，写入软件前应以数据手册的“每机械圈最终计数数”为准。

```c
    // 启动 ABZ 编码器的 A/B 正交计数
    HAL_TIM_Encoder_Start(&htim4, TIM_CHANNEL_ALL); // 启动编码器接口
    uint16_t cnt = __HAL_TIM_GET_COUNTER(&htim4);
```

**读取编码器数值：** 建议在与 PWM 和电流采样同步的 FOC 控制周期（例如 16 kHz）中读取，无需额外占用一个定时器。

| 考量点           | 说明                                             |
| ---------------- | ------------------------------------------------ |
| **同步性**       | 速度/位置采样与 PWM 更新严格同步，控制延迟最小   |
| **节省资源**     | 不额外占用定时器                                 |
| **FOC 算法需要** | Clarke/Park 变换需要实时角度，必须与电流采样同步 |
| **16 kHz 足够**  | 对大多数电机应用，16 kHz 采样位置信息远超需求    |

**Z 相配置：** Z 相通常每转产生一个短脉冲，但空闲电平、有效边沿和脉宽因器件而异。中断服务函数应尽量简短，只锁存当前 CNT、方向和时间戳或设置事件标志；偏移量计算、Flash 保存和状态切换放到校准状态机中完成。

#### 11.2.2 Z 相校准：读取当前 CNT 值

```c
z_capture_cnt = __HAL_TIM_GET_COUNTER(&htim4);
z_event_pending = true;
```

#### 11.2.3 Z 相校准：计算位置差（Delta）

计算当前计数与参考计数之间的有符号差值时，必须处理 ARR 回绕。完整的零点偏移定义和校准状态机将在编码器校准专题文章中整理。

**UVW 霍尔信号：**

![image-20260303091139201](https://kyro-qu.github.io/blog-images-1/posts/foc-overview/image-20260303091139201.png)

#### 11.2.4 SPI 编码器

SPI 绝对式编码器可直接提供单圈机械角度。驱动建议放在 `driver` 目录，并提供初始化、原始角度读取、通信错误检测和角度有效性判断等接口。控制周期中应尽量使用 DMA 或确定时延的阻塞传输，并根据编码器数据手册处理奇偶校验、状态位和通信延迟。

### 11.3 CAN 调试与工具

#### 11.3.1 Cangaroo

袋鼠（Cangaroo）是一款开源 CAN 总线分析工具，可配合 CANable 2.0 硬件进行报文收发、记录和调试。

## 12. 软件架构

### 12.1 分层设计

- **硬件抽象层（HAL）：** 操作 MCU 寄存器或外设库，包括定时器 PWM、ADC 采样以及编码器或霍尔接口。
- **驱动层（Driver）：** 负责电流采样与重构、传感器角度读取、故障检测和硬件相关补偿。
- **FOC 算法层（Core）：** 实现 Clarke/Park 变换、PI 控制器和 SVPWM 等纯数学运算。
- **应用层（App）：** 管理待机、预定位、运行和故障状态机，并实现速度环、位置环及通信协议。

依赖方向应尽量保持为 App → Core/Driver → HAL；Core 层不直接写定时器寄存器，方便仿真、单元测试和平台移植。

### 12.2 配置与运行状态

以下示例将静态配置与实时状态分开保存：

```c
// foc_config.h
typedef struct {
    // 电机物理参数
    float pole_pairs;       // 极对数
    float phase_resistance; // 相电阻
    float phase_inductance; // 相电感
    float current_limit;    // 电流限值
    float bus_voltage;      // 母线电压

    // PI 控制器参数
    float kp_id, ki_id;     // D轴电流环参数
    float kp_iq, ki_iq;     // Q轴电流环参数

    // 系统参数
    float pwm_frequency;    // PWM 频率（如 20 kHz）
    float control_dt;       // 控制周期（通常为 1 / pwm_frequency）
} motor_config_t;

// foc_state.h
typedef struct {
    // 传感器输入
    float theta_mech;       // 机械角度
    float theta_elec;       // 电角度
    float velocity;         // 实时转速

    // ADC 采样电流
    float i_a, i_b, i_c;    // 三相物理电流

    // 坐标变换变量
    float i_alpha, i_beta;  // Clarke 变换后电流
    float i_d, i_q;         // Park 变换后电流
    float v_d, v_q;         // PI 输出的 D/Q 轴电压
    float v_alpha, v_beta;  // 逆 Park 变换后电压

    // PWM 占空比输出
    float duty_a, duty_b, duty_c;
} foc_state_t;
```

### 12.3 命名规范

- 变量和函数使用小写蛇形命名法，例如 `uart_receive_len`、`motor_start()`。
- 类型名使用小写蛇形命名法并以 `_t` 结尾，例如 `motor_config_t`。
- 常量和宏使用大写蛇形命名法，例如 `MAX_BUFFER_SIZE`、`I2C_TIMEOUT_MS`。
- 缩写只保留领域内通用形式，例如 ADC、PWM、CAN；其余名称优先写完整，避免难以理解的短缩写。
