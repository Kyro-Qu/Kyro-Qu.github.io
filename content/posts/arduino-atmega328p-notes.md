---
title: "Arduino 与 ATmega328P 入门笔记"
subtitle: "Uno/Nano 常用功能速查"
date: 2026-09-30T21:00:00+08:00
draft: false
tags: ["嵌入式"]
featured: false
mood: "focus"
description: "以 16 MHz、5 V 经典 Uno/Nano 为例，整理 ATmega328P 开发板规格与 GPIO、PWM、ADC、中断、串口，以及 OLED、DHT11、WS2812 的常用接线与示例代码。"
image: "/images/og/arduino-atmega328p-notes.png"
---
Arduino Uno 与经典 Nano 常以 ATmega328P 为核心。它们适合作为学习微控制器的入门平台：开发板把供电、时钟、复位和 USB 串口下载等电路集成起来，Arduino IDE 则提供了简化的程序框架和常用外设接口。

本文以 **16 MHz、5 V 的经典 ATmega328P Uno/Nano** 为例，整理开发板规格、GPIO、PWM、ADC、中断、串口，以及 OLED、DHT11 和 WS2812 的常用操作。不同版本的开发板和模块可能存在引脚、供电或库配置差异，接线前应以具体板卡资料为准。

## 1. 开发板与芯片概览

ATmega328P 是 8 位 AVR 微控制器。常见的经典 Uno 与 Nano 开发板主要规格如下：

| 项目 | 经典 Uno/Nano 常见规格 |
| --- | --- |
| 工作电压 | 5 V |
| 时钟频率 | 16 MHz |
| 数字 I/O | 14 路（D0–D13） |
| 模拟输入 | Uno：A0–A5；经典 Nano 通常还引出 A6、A7（仅模拟输入） |
| PWM 输出 | D3、D5、D6、D9、D10、D11 |
| 硬件 UART | 1 路（D0/RX、D1/TX） |
| ADC | 10 位，读数通常为 0–1023 |

> 以上是常见板卡的概览，不代表所有采用 ATmega328P 的兼容板都完全相同。尤其要注意：Nano 的 A6/A7 通常不能作为数字 I/O 使用；D0、D1 与 USB 串口共用，连接其他电路可能影响下载和串口通信。

![ATmega328P 开发板原理图](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/image-20260930172604381.png)

![开发板尺寸图](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/asset.png)

### 编译与下载

在 Arduino IDE 中选择对应的开发板型号和串口端口，编译后通过 USB 下载程序。不同 Nano 克隆板使用的 USB 转串口芯片和 bootloader 可能不同；若上传失败，检查板型、处理器/bootloader 选项、端口和数据线，并参考板卡说明。

![板卡连接示意](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/image-20260930172812961.png)

![编译与下载示意](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/image-20260930174616061.png)

## 2. Arduino 程序的基本结构

Arduino 草图通常包含 `setup()` 和 `loop()`：`setup()` 在上电或复位后执行一次，用于初始化；`loop()` 随后不断重复执行。

```cpp
void setup() {
  // 初始化代码：配置引脚、串口、传感器等
}

void loop() {
  // 主循环：反复执行任务
}
```

## 3. GPIO：数字输入与输出

### 常用函数

```cpp
pinMode(pin, mode);           // 配置 INPUT、OUTPUT 或 INPUT_PULLUP
 digitalWrite(pin, HIGH);     // 输出高电平；也可写 LOW
int state = digitalRead(pin); // 读取 HIGH 或 LOW
```

`INPUT_PULLUP` 会启用芯片内部上拉电阻。使用它连接按钮时，常见接法是按钮一端接输入引脚、另一端接 GND：未按下读到 `HIGH`，按下读到 `LOW`。外部电路仍需遵守芯片引脚电压和电流限制。

### LED 闪烁

下面使用 D13（经典 Uno/Nano 的板载 LED 通常连接在该引脚；也可使用限流电阻和外接 LED）。不要把 D0、D1 当作普通 LED 引脚，以免干扰串口。

```cpp
const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(1000);
  digitalWrite(ledPin, LOW);
  delay(1000);
}
```

### 按钮控制 LED

```cpp
const int buttonPin = 2;
const int ledPin = 13;

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // 内部上拉接法：按下为 LOW
  const bool pressed = (digitalRead(buttonPin) == LOW);
  digitalWrite(ledPin, pressed ? HIGH : LOW);
}
```

机械按钮会抖动；简单状态控制通常可以先直接读取，若需要可靠的单次按键事件或精确计数，应增加软件消抖或硬件消抖。

### 时间函数

```cpp
delay(1000);                  // 阻塞等待 1000 ms
unsigned long ms = millis();  // Arduino 启动以来经过的毫秒数
unsigned long us = micros();  // Arduino 启动以来经过的微秒数
```

`millis()` 返回无符号计数值，约 **49.7 天**后会回绕；`micros()` 也会回绕（在经典 16 MHz AVR 板上约每 70 分钟）。用无符号差值判断时间间隔可安全处理回绕：

```cpp
if ((unsigned long)(millis() - previousMs) >= intervalMs) {
  previousMs = millis();
  // 执行周期任务
}
```

## 4. PWM：模拟效果输出

ATmega328P 的指定引脚可通过 `analogWrite()` 输出 PWM（脉宽调制）信号。经典 Uno/Nano 的 PWM 引脚为 **D3、D5、D6、D9、D10、D11**，常用取值为 0–255：0 对应持续低电平，255 对应持续高电平，中间值表示不同占空比。它不是 DAC，不会直接产生稳定的中间模拟电压。

```cpp
const int pwmPin = 9;

void setup() {
  pinMode(pwmPin, OUTPUT);
  analogWrite(pwmPin, 128);  // 约 50% 占空比
}

void loop() {
}
```

经典 Uno 上 D9 的 PWM 频率约为 490 Hz，具体频率因引脚和定时器配置而异。若程序或库重新配置了相关定时器，频率也可能改变。可用示波器或逻辑分析仪在引脚与 GND 间测量。

![PWM 波形测量示意](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/a8db850bd247e1c96da1c3322e2777f0.jpg)

## 5. ADC：读取模拟量

`analogRead(pin)` 将模拟输入转换为数字读数。在经典 Uno/Nano 的默认配置下，ADC 为 10 位，读数范围是 **0–1023**。可测电压范围由模拟参考电压决定；默认参考通常与板卡的 `DEFAULT` 参考相关，不能不加确认地假设一定精确为 5.000 V。输入电压不得超出芯片和开发板允许范围。

```cpp
const int analogPin = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  const int rawValue = analogRead(analogPin);

  // 示例假定实际参考电压为 5.0 V；更准确换算应使用实测 Vref
  const float referenceVoltage = 5.0f;
  const float voltage = rawValue * (referenceVoltage / 1023.0f);

  Serial.print("ADC: ");
  Serial.print(rawValue);
  Serial.print(" | Voltage: ");
  Serial.print(voltage, 3);
  Serial.println(" V");

  delay(200);
}
```

换算公式为：

$$
V_{in} \approx \frac{N}{1023} V_{ref}
$$

其中 `N` 是 ADC 读数，`Vref` 是实际参考电压。实际精度还受参考源误差、噪声、输入源阻抗和 ADC 特性影响。

![串口监视器查看 ADC 结果](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/image-20260930200034068.png)

## 6. 外部中断

经典 Uno/Nano 的 ATmega328P 通常在 D2、D3 提供外部中断，对应 Arduino 中断号 0、1。推荐用 `digitalPinToInterrupt(pin)` 将引脚号转换为中断号：

```cpp
attachInterrupt(digitalPinToInterrupt(pin), isr, mode);
```

常见触发模式包括 `LOW`、`CHANGE`、`RISING` 和 `FALLING`。电平触发的 `LOW` 在引脚保持低电平时可能持续进入中断，按钮场景通常考虑边沿触发。

中断服务函数（ISR）应尽量短：不要在其中调用 `delay()`、做串口输出或执行耗时操作。与主循环共享的变量通常声明为 `volatile`；ISR 中只设置标志，实际工作放到 `loop()` 中完成。

```cpp
const int buttonPin = 2;
const int ledPin = 13;

volatile bool buttonPressed = false;
bool ledState = false;

void handleInterrupt() {
  buttonPressed = true;
}

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(buttonPin), handleInterrupt, FALLING);
}

void loop() {
  if (buttonPressed) {
    buttonPressed = false;
    ledState = !ledState;
    digitalWrite(ledPin, ledState ? HIGH : LOW);
  }
}
```

`volatile` 只要求编译器每次从内存读取变量，并不保证复合操作或多字节访问的原子性。上例中的 `bool` 标志在 ATmega328P 上通常可通过简单读写使用；共享多字节数据时，需要额外考虑原子访问和临界区。按钮抖动也可能产生多个边沿，实际项目仍需消抖。

## 7. UART 串口

经典 Uno/Nano 的硬件 UART 使用 D0/RX 和 D1/TX，并通常经 USB 转串口芯片连接电脑。板载串口与外部设备连接时，注意 TX/RX 交叉连接、共地和电平兼容；不要让 5 V 信号直接进入不耐 5 V 的设备。

```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println("Hello, world!");

  if (Serial.available() > 0) {
    const char received = Serial.read();
    Serial.print("Received: ");
    Serial.println(received);
  }

  delay(1000);
}
```

- `Serial.print()` 输出内容但不自动换行。
- `Serial.println()` 输出内容并追加换行符。
- `Serial.available()` 返回接收缓冲区中可读取的字节数。
- `Serial.read()` 读取一个字节；文本协议需自行定义分隔符和完整帧的处理方式。

需要按行接收时，可以使用 `Serial.readStringUntil('\n')`，但该调用会等待换行或超时；对时序敏感的程序，更适合用非阻塞方式逐字节组帧。

![Arduino IDE 串口监视器](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/image-20260930202341545.png)

串口监视器中的波特率应与程序的 `Serial.begin()` 一致。发送一行文本时，应确认监视器的行结束符设置与程序读取方式匹配。

## 8. I²C OLED（SSD1306）

常见 0.96 英寸 SSD1306 OLED 模块可通过 I²C 与开发板通信。经典 Uno/Nano 的硬件 I²C 引脚通常是 **A4/SDA、A5/SCL**；若板上标有 SDA/SCL 专用引脚，也可按板卡标注连接。模块供电电压、逻辑电平和 I²C 地址需以模块规格为准，常见地址为 `0x3C`，也有 `0x3D`。

在 Arduino IDE 的库管理器中安装 **Adafruit SSD1306** 和 **Adafruit GFX Library**。

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void setup() {
  Serial.begin(9600);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 初始化失败，请检查接线和 I2C 地址。"));
    while (true) {
    }
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("Hello, world!"));

  display.setTextSize(2);
  display.setCursor(0, 16);
  display.println(F("SSD1306"));
  display.display();  // 将缓冲区内容写入屏幕
}

void loop() {
}
```

Adafruit SSD1306 库先在 MCU 内存缓冲区绘图，调用 `display.display()` 后才会把内容传输到屏幕。128×64 单色帧缓冲约占 1024 字节 SRAM；ATmega328P 只有 2 KB SRAM，因此同时使用较多库或较大的缓冲区时要留意内存占用。

## 9. DHT11 温湿度传感器

安装 Adafruit 的 **DHT sensor library**（若 IDE 提示依赖，也安装 Adafruit Unified Sensor）。裸 DHT11 通常需要数据线上拉电阻；带 PCB 的三针模块可能已集成上拉电阻。供电电压应按模块规格选择。

```cpp
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  delay(2000);  // DHT11 采样间隔较长，遵循传感器/库要求

  const float humidity = dht.readHumidity();
  const float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println(F("读取 DHT11 失败，请检查接线。"));
    return;
  }

  Serial.print(F("Humidity: "));
  Serial.print(humidity, 1);
  Serial.print(F(" % | Temperature: "));
  Serial.print(temperature, 1);
  Serial.println(F(" C"));
}
```

传感器读数可能因型号、模块和环境而有误差。发生 `NaN` 时，优先检查供电、数据引脚、上拉电阻、库依赖和采样间隔。

## 10. 串口绘图仪

串口绘图仪适合观察随时间变化的数值。每次采样输出一行数值，多个通道之间使用逗号或制表符分隔，并以换行结束。不要把解释性文字、单位符号混进数值数据行。

```cpp
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  delay(2000);

  const float humidity = dht.readHumidity();
  const float temperature = dht.readTemperature();
  if (isnan(humidity) || isnan(temperature)) {
    return;
  }

  // 每行一帧；具体标签解析格式可能随 Arduino IDE 版本而异
  Serial.print("Temperature:");
  Serial.print(temperature, 1);
  Serial.print(",Humidity:");
  Serial.println(humidity, 1);
}
```

绘图仪的标签语法和界面会因 Arduino IDE 版本不同而有差异。如果键值对标签没有被识别，可先改为仅输出 `温度,湿度` 两列数值，并查看对应 IDE 版本的串口绘图仪说明。

![串口绘图仪示意](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/image-20260930213428415.png)

## 11. WS2812 / NeoPixel 灯带

WS2812 通过单线时序数据级联控制。MCU 的数据输出连接第一颗灯的 `DIN`（有些资料标为 `DI`），灯珠的 `DOUT/DO` 再连接下一颗的 `DIN`。还需连接共地，并按灯带规格提供足够的电源；多颗灯珠不应由 MCU GPIO 直接供电。

在库管理器中安装 **Adafruit NeoPixel**。以下例子假设数据线连接 D12、灯珠顺序为 GRB、时序为 800 kHz；具体芯片版本和灯带配置不同时应调整参数。

```cpp
#include <Adafruit_NeoPixel.h>

#define LED_PIN 12
#define NUM_LEDS 3

Adafruit_NeoPixel pixels(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  pixels.begin();
  pixels.setPixelColor(0, pixels.Color(80, 0, 0));  // 红
  pixels.setPixelColor(1, pixels.Color(0, 80, 0));  // 绿
  pixels.setPixelColor(2, pixels.Color(0, 0, 80));  // 蓝
  pixels.show();
}

void loop() {
}
```

![WS2812 实物连接示意](https://kyro-qu.github.io/blog-images-1/posts/arduino-atmega328p-notes/f0019def99e3eb8312418b38aec54a0a.jpg)

## 12. 实践中的几个注意点

1. **确认板型与引脚映射**：Uno、Nano 及兼容板的引脚引出和 USB 转串口电路可能不同。
2. **注意电源与逻辑电平**：传感器、显示屏和灯带的供电范围不尽相同；共地不等于信号电平兼容。
3. **为 SRAM 留余量**：ATmega328P 的 SRAM 只有 2 KB。避免不必要的大型 `String`、过多缓冲区和动态内存分配；固定文本可考虑 `F()` 宏。
4. **串口占用 D0/D1**：下载或使用 USB 串口时，尽量不要让外部电路同时驱动这两个引脚。
5. **中断保持简短**：ISR 中只做必要标记，耗时处理放回主循环，并为机械按键考虑消抖。
6. **核对模块资料**：I²C 地址、OLED 分辨率、NeoPixel 色彩顺序以及供电要求都可能因模块而异。

## 参考资料

- [Arduino 官方语言参考](https://docs.arduino.cc/language-reference/)：查看 `pinMode()`、`digitalRead()`、`analogRead()`、`attachInterrupt()` 等 API。
- [Arduino Uno Rev3 官方规格](https://docs.arduino.cc/hardware/uno-rev3/)：查看开发板接口和规格。
- [太极创客](http://www.taichi-maker.com/)：Arduino 中文教程与实践资料。
- [立创开发板文档](https://wiki.lckfb.com/zh-hans/coloreasyduino/)：开发板与外设参考。
- [W3Cschool Arduino 教程](https://www.w3cschool.cn/arduino/)：Arduino 入门资料。
