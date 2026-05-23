---
title: "Voice Agent"
subtitle: "从唤醒、ASR、LLM 到 TTS 的整体框架梳理"
date: 2026-05-19T22:40:00+08:00
draft: false
tags: ["Voice Agent", "ASR", "TTS", "LLM", "MCP"]
featured: false
mood: "focus"
description: "一篇关于 Voice Agent 架构的入门笔记，整理唤醒、语音识别、LLM、MCP 与 TTS 的协作链路。"
---
Voice Agent 是一种融合了语音处理与大语言模型推理能力的智能体，能够实现实时、自然、类人化的语音交互体验，就像钢铁侠的贾维斯。

## Framework

系统架构： 唤醒  → 录音 → ASR(STT) → NLP/LLM → 文本回复 → TTS播放 / 动作行为

1. 唤醒（Wake）：边缘设备检测唤醒词，启动交互。
2. 录音（Recording）：采集用户语音。
3. ASR/STT（Speech to Text）：将语音转换为文本。
4. NLP/LLM：理解意图、生成回复。
5. 文本回复：处理回复内容。
6. TTS播放 / 动作行为：合成语音输出或执行控制动作。

## Wake (Edge Side)

设备通常在本地（边缘端）完成，低功耗、低延迟、隐私，当检测到预设唤醒词（如“Hey Siri”或“Alexa”）时，系统激活后续流程。

麦克风采集音频  →  本地唤醒词检测（Wake Word）  →  唤醒成功 → 启动录音  → 上传到云端（HTTP / WebSocket / MQTT）

常见技术 / 框架

- PocketSphinx，适合嵌入式设备。
- ESP-SR 乐鑫语音识别框架
- Jasper / Porcupine（Picovoice）
- Snowboy（经典开源唤醒引擎（虽已停更，但仍被广泛使用）

## ASR/ STT

ASR = Automatic Speech Recognition ，语音识别，语音转文字。实现声音 → 文字，不理解语义

常见技术 / 框架

- 本地部署
  - Kaldi（经典开源 ASR），广泛用于学术和工业研究，有大量书籍和教程资源。
  - ESP-SR
- 云端 API
  - 科大讯飞 ASR
  - 百度 DuerOS
  - 微软 Azure Speech to Text
  - OpenAI Whisper：开源，可部署本地。 https://github.com/openai/whisper

## NLP / LLM

这是 Voice Agent 的“大脑”：文本   →  NLP / LLM   →  意图识别 / 对话理解 / 回复内容

传统 NLP：Natural Language Processing，自然语言处理）

- 指令型设备控制，“打开灯 / 调大音量”

现代 LLM：（Natural Language Processing，自然语言处理）

- 语义理解
- 多轮对话
- 推理
- 调用工具（Agent / MCP）

常见LLM技术 / 框架

- DeepSeek
- Qwen 通义千问
- OpenAI GPT-4o

## Agent / MCP

MCP（Model Context Protocol）

LLM   →  Agent 决策   →  调用工具 / API / 设备

MCP (Model Context Protocol)：旨在让 AI 能够更标准化地访问本地数据和工具。

## TTS

Text-To-Speech，语音合成，用于给出语音应答相当于嘴巴，可定制不同声色。文本    →  TTS引擎   →  音频

常见技术 / 框架

- OpenAI 
- 科大讯飞 TTS
- GPT-SoVITS
- 百度 TTS
- Azure Speech TTS
- IndexTTS（开源）
- ESP-TTS（嵌入式）、
- Apple macos say：主要部署在mac电脑，利于使用系统API

## Action & Control

控制协议：MQTT 智能家居联网 ，HTTP 

平台：Home Assistant

## 拓展：

​	多模态 Multi-modal Agent：给智能体设备添加摄像头，通过ImageData，VideoData，理解看到场景，做决策。

## About Project：

小智：https://xiaozhi.dev/docs/

悟空机器人：https://wukong.hahack.com/#/

志辉君 迷你语音助手机器人 Pico ： https://zhihui.lingjun.life/2019/07/15/pico/

Jasper：https://github.com/jasperproject/jasper-client

**API：**

科大讯飞：https://www.xfyun.cn/doc/

百度：https://dueros.baidu.com/open

微软Azure：https://azure.microsoft.com/zh-cn/products/ai-foundry/tools/speech



## Other

**边缘侧设备选型**：重点在于支持网络连接（Wi-Fi/Bluetooth/Ethernet）与本地唤醒词和TTS的运算。

- MPU：瑞芯微 / 全志 / 晶晨 / Raspberry Pi
- MCU: ESP32S3 , ESP32C3

**可能的成本：**

- 个性化的唤醒词与音色,需要GPU训练
- 部署LLM（如 Qwen,DeepSeek）的服务器 或 使用厂商的API key
- MQTT 云服务
- ASR/TTS 服务：云 API



## 技术实现

前端：	ESP32-S3-BOX3	 https://github.com/espressif/esp-box

后端：SpringBoot	APP

- ASP：DoubleASP
- TTS：DoubleTTS
- LLM：DeepSeek

####  WebSocket API 

小智 AI开源链接：https://github.com/78/xiaozhi-esp32/blob/main/README_zh.md

小智 AI手册：https://my.feishu.cn/wiki/F5krwD16viZoF0kKkvDcrZNYnhb

### 开发环境

https://icnynnzcwou8.feishu.cn/wiki/JEYDwTTALi5s2zkGlFGcDiRknXf
