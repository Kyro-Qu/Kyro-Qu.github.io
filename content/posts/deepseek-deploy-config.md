---
title: "DeepSeek 本地部署配置"
subtitle: "DeepSeek 与 Ollama 的本地部署记录"
date: 2026-05-19T21:30:00+08:00
draft: false
tags: ["DeepSeek", "Ollama", "Linux"]
featured: false
mood: "focus"
description: "DeepSeek 蒸馏模型与 Ollama 本地部署配置记录。"
---
## DeepSeek

蒸馏模型适合本地部署，资源占用相对可控。

如果电脑运行内存是 8 GB，可以优先考虑 `1.5b`、`7b`、`8b` 这些蒸馏模型。

如果电脑运行内存是 16 GB，可以继续尝试 `14b` 版本。

我这里选择 `7b` 模型，参数越大，通常效果也会更好。

搜索结果里会出现很多个版本，主要区别就是参数规模不同。

`1.5b`、`7b`、`8b`、`14b`、`32b`、`70b`、`671b`

### 硬件建议

- 7B 模型：至少 8 GB 内存
- 14B 模型：推荐 16 GB 内存，最好配合 GPU 加速
- 量化模型（如 `Q4`）：可以进一步降低显存占用

## Ollama

Ollama 是一个轻量级的本地 AI 模型运行框架，官网是 [ollama.com](https://ollama.com/)。

可以把 Ollama 理解成一个“后台引擎”。

Ollama 支持 `Windows`、`Linux`、`macOS` 平台。

**使用方式分为两种**

- 用终端命令行（`curl`）或者自己写 Python、C++ 代码，直接向它的 API 发送请求。这种方式适合把 AI 接入到自己的项目中。
- 下载第三方图形界面软件（比如 **Open WebUI** 或 **Chatbox**）。这些软件连接到 Ollama 的 `11434` 端口后，就可以像使用网页版聊天工具一样使用本地模型。

## 部署

### 安装 Ollama

将 Ollama 压缩包解压到根目录下：

```bash
sudo tar -xvf ollama-linux-amd64.tgz -C /
```

验证是否安装成功：

```bash
# 验证安装
ollama --version
ollama help
```

![image-20260316192245873](/images/posts/deepseek-deploy-config/image-20260316192245873.png)

开启 Ollama 服务：

```bash
ollama serve
```

### 模型下载

模型搜索页面：[https://ollama.com/search](https://ollama.com/search)

#### DeepSeek 模型

在 Ollama 服务已经启动的情况下（可以开两个终端），就能下载 DeepSeek 的不同版本：

```bash
ollama pull deepseek-r1:1.5b
ollama pull deepseek-r1:7b
```

其他版本只需要切换模型后缀即可：

| 版本 | 说明 | 命令 |
| --- | --- | --- |
| `1.5b` | 适合一般文字编辑，约需 1.1 GB 空余空间 | `ollama run deepseek-r1:1.5b` |
| `7b` | 更适合本地推理与通用问答，约需 4.7 GB 空余空间 | `ollama run deepseek-r1:7b` |
| `8b` | 约需 4.9 GB 空余空间 | `ollama run deepseek-r1:8b` |
| `14b` | 约需 9 GB 空余空间 | `ollama run deepseek-r1:14b` |
| `32b` | 约需 20 GB 空余空间 | `ollama run deepseek-r1:32b` |
| `70b` | 约需 43 GB 空余空间 | `ollama run deepseek-r1:70b` |
| `671b` | 约需 404 GB 空余空间 | `ollama run deepseek-r1:671b` |

#### 千问模型

下载 `qwen3:14b` 模型：

```bash
ollama pull qwen3:14b
```

也可以直接执行 `ollama run qwen3:14b`。如果本地还没有这个模型，Ollama 会自动开始下载：

```bash
ollama run qwen3:14b
```

### 监听与环境变量

在使用 DeepSeek 的时候，需要在前台保持 Ollama 服务运行：

```bash
ollama serve
# 开启服务后才能使用
```

配置系统环境变量：

```bash
# 监听所有网络接口
echo 'export OLLAMA_HOST="0.0.0.0"' >> ~/.bashrc
echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc

# 写入后重新加载配置
source ~/.bashrc

# 重新开启服务
ollama serve
```

## 对话

```bash
ollama serve # 启动基础推理服务
```

确认 Ollama 的后台程序有没有在正常工作：

```bash
curl http://localhost:11434/
```

相当于喊了一声“喂，在吗？”，正在监听的 Ollama 会通过网络回复一句 `"Ollama is running"`。

![image-20260316200231887](/images/posts/deepseek-deploy-config/image-20260316200231887.png)

### 命令行交互

终端会变成一个类似微信的对话框（前面带个 `>>>` 提示符），它会自动记住之前说过的话，也就是有上下文记忆。

连续对话的聊天室模式：

```bash
ollama serve              # 启动基础推理服务
ollama run deepseek-r1:7b # 另开终端运行模型
/bye                      # 结束对话
```

![image-20260316205222813](/images/posts/deepseek-deploy-config/image-20260316205222813.png)

### curl 方式

这是最原始、最直接的 API 调用方式，返回的是结构化的 JSON 数据。

如果开启流式输出，模型会一边生成一边返回内容，看起来会像打字机效果。

```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
        "model": "deepseek-r1:1.5b",
        "prompt": "新中国哪一年成立的？",
        "stream": true
      }'
```

`"model": "deepseek-r1:1.5b"` 表示这次请求要调用的具体模型。

`"prompt": "hello"` 表示输入给模型的提示词。

`"stream": true` 表示开启流式传输；如果设为 `false`，模型会等整段内容生成完成后再一次性返回。

![image-20260316200406390](/images/posts/deepseek-deploy-config/image-20260316200406390.png)

### Python 方式

创建 `chat.py` 文件：

```bash
nano chat.py
```

复制并粘贴下面这段代码：

```python
import urllib.request
import json
import sys


def chat_with_ollama(prompt):
    url = "http://localhost:11434/api/generate"
    # 构建发给大模型的数据包
    data = {
        "model": "deepseek-r1:1.5b",
        "prompt": prompt,
        "stream": False
    }

    # 将数据打包为 JSON 格式并设置请求头
    req = urllib.request.Request(
        url,
        json.dumps(data).encode("utf-8"),
        {"Content-Type": "application/json"}
    )

    try:
        # 发送请求并接收回复
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            print("\\n🤖 DeepSeek 回复:\\n")
            print(result.get("response", "没有获取到回复。"))
    except Exception as e:
        print(f"\\n❌ 请求失败，请检查 Ollama 是否在运行。错误信息: {e}")


if __name__ == "__main__":
    # 检查是否在命令行里输入了问题
    if len(sys.argv) > 1:
        user_input = sys.argv[1]
        print(f"正在思考: {user_input} ... (请稍等)")
        chat_with_ollama(user_input)
    else:
        print('请提供一个问题！例如: python3 chat.py "你好"')
```

保存并退出：

1. 按 `Ctrl + O` 保存文件
2. 按 `Enter` 确认文件名
3. 按 `Ctrl + X` 退出编辑器

运行示例：

```bash
python3 chat.py "新中国哪一年成立的？"
```

![image-20260316195046423](/images/posts/deepseek-deploy-config/image-20260316195046423.png)

## 其他

### 常用指令

```bash
# ========== 基础命令 ==========
ollama --version                    # 查看版本

# ========== 服务管理 ==========
ollama serve                        # 开启服务（必须先启动才能使用）

# ========== 模型管理 ==========
ollama list                         # 查看已下载的所有模型
ollama pull <model-name>            # 下载模型
ollama rm <model-name>              # 删除模型
ollama show <model-name>            # 查看模型信息

# ========== 运行管理 ==========
ollama ps                           # 查看运行中的模型
ollama run <model-name>             # 启动模型（进入交互模式）
ollama stop <model-name>            # 关闭模型

# ========== 交互模式内 ==========
Ctrl + D                            # 退出交互模式
/bye                                # 退出交互模式（同上）
```

示例：

```bash
ollama pull deepseek-r1:1.5b
ollama rm deepseek-r1:1.5b
ollama rm qwen:0.5b
ollama show qwen3:14b
ollama stop qwen3:14b
```

### IP 与端口

`http://localhost:11434/`

**IP 地址** = **大楼的街道地址**，决定了数据要送到哪台电脑。

**端口（Port）** = **大楼里的房间号**，决定了数据由电脑里的哪个软件来接收。因为电脑里可能同时运行着很多程序（微信、浏览器、Ollama），必须用端口号把它们区分开。`11434` 就是 Ollama 专属的房间号。

#### 仅本机访问

`http://localhost:11434/`

本机浏览器会显示 `Ollama is running`。

这种方式只适合自己跟自己通信，同一局域网下的其他设备无法通过 `localhost` 访问你这台电脑上的 Ollama。

#### 局域网开放访问

`http://192.168.6.120:11434/`

只要在同一个 Wi-Fi 或局域网下，其他设备就可以通过这个地址访问你的电脑。

默认情况下，Ollama 只监听 `localhost`。配置 `0.0.0.0` 之后，Ollama 会同时监听局域网网卡接口，允许手机、开发板或其他电脑发起请求。

```bash
OLLAMA_HOST="0.0.0.0"
```

### 参考资料

- [Ollama 中文文档](https://ollama.cadn.net.cn/) - 适合快速查配置项和命令参数
- [菜鸟教程 - Ollama](https://www.runoob.com/ollama) - 适合快速入门和基础命令回顾
- [知乎 - DeepSeek 部署实践](https://zhuanlan.zhihu.com/p/1913901917786056107) - 适合参考社区经验和常见踩坑记录
