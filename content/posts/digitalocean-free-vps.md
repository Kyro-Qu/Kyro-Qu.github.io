---
title: "申请 DigitalOcean 免费 VPS 服务器"
subtitle: "用 GitHub Student Developer Pack 领取 DigitalOcean 额度并创建 Droplet"
date: 2026-06-10T03:45:00+08:00
draft: false
tags: ["云服务"]
featured: false
mood: "focus"
description: "记录通过 GitHub Student Developer Pack 领取 DigitalOcean 学生额度、绑定支付方式、创建项目、选择 Droplet 配置并上传 SSH 公钥的完整流程。"
---
这次申请到的是一年的 VPS 服务器，可以把它当成年抛来用：通过 GitHub Student Developer Pack 领取一笔 DigitalOcean 平台额度，再用这笔额度去创建 Droplet。只要月费控制在额度范围内，就可以把它当作一台长期学习用 VPS。

这篇记录按实际操作顺序整理：先领取学生包额度，再创建 DigitalOcean 项目和 Droplet，最后配置 SSH 密钥。涉及费用的地方一定要多看一眼账单页，因为云服务最怕“机器还在，自己忘了”。

## 领取学生包额度

入口是 GitHub Student Developer Pack：

https://education.github.com/pack

![GitHub Student Developer Pack 页面](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609181421565.png)

正常登录 GitHub 账号，并完成学生身份相关授权后，进入 DigitalOcean 的领取流程。DigitalOcean 仍然会要求绑定支付方式，常见选择包括 PayPal、信用卡和支付宝。

如果使用支付宝，建议领取完成后检查支付宝里的自动扣款或免密支付授权，按自己的需要关闭或保留。关闭前要确认 DigitalOcean 账户里仍有可用支付方式，避免影响后续资源管理。

截至 2026-06-10，GitHub Student Developer Pack 页面展示的 DigitalOcean 云服务权益是 200 美元平台额度，有效期 1 年。额度、适用范围和限制可能调整，正式使用前以 GitHub 和 DigitalOcean 页面为准。

![DigitalOcean 学生权益通过页面](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/2cf094270fa90b6996ae44c238efe2fb.png)

## 查看赠金

领取完成后，进入 DigitalOcean 控制台的 Billing 页面查看 Credits。这里会显示初始额度、剩余额度和到期时间。

![在 Billing 页面查看 Credits](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609181330929.png)

后续每次创建资源前，建议先回到 Billing 看一下剩余额度。DigitalOcean 的账单是按资源使用计费的，不是“领取了额度就完全不用管”。

## 创建项目

DigitalOcean 里的资源通常挂在 Project 下面。可以先创建一个新项目，也可以选择已有项目。

![创建或选择项目](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609181651874.png)

进入项目后，才能继续创建云服务器，也就是 DigitalOcean 里的 Droplet。

![项目里的资源创建入口](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609182009127.png)

如果页面入口样式不同，也可以从 Create 菜单进入 Droplet 创建流程。

![另一种创建入口](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609182146982.png)

![选择 Droplets 服务](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609182216942.png)

## 选择地区和系统

进入 Droplet 创建页后，先选机房区域和系统镜像。学习和日常折腾用途可以优先选择离自己近、延迟低的区域；系统镜像一般选 Ubuntu LTS 会比较省心。

![选择地区和系统镜像](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609183432842.png)

## 选择套餐

如果目标是让 200 美元额度尽量撑满一年，月费最好控制在 200 / 12，也就是约 16.6 美元以内。

这次选择的是：

- 1 Intel vCPU
- 2 GB RAM
- 70 GB NVMe
- 2 TB 流量

![选择 Droplet CPU 与套餐](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609183044515.png)

这个配置适合学习 Linux、部署轻量服务、跑个人项目和测试环境。正式跑业务前还要根据流量、存储、备份和安全需求重新评估。

## 配置 SSH 密钥

创建 Droplet 时建议使用 SSH 密钥登录，而不是单纯依赖密码。SSH 密钥是一对文件：

- 私钥：保存在自己电脑上，不要上传、不要发给别人。
- 公钥：可以上传到 DigitalOcean，用来让服务器识别你的电脑。

![创建 SSH 密钥入口](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609183952543.png)

![SSH 密钥配置页面](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609184111991.png)

在 Windows 上可以打开 PowerShell，生成一对新密钥：

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

如果你只是本机学习使用，也可以一路按回车，使用默认保存路径。终端提示设置 passphrase 时，想要更安全就设置一个密码；想要省事可以直接回车跳过。

注意：如果系统提示目标文件已经存在，不要随手覆盖旧密钥。先确认旧密钥是不是还在用于 GitHub、服务器或其他服务。

密钥一般会保存在：

```text
C:\Users\用户名\.ssh\
```

你需要复制的是 `.pub` 结尾的公钥文件内容，例如：

```text
id_ed25519      私钥，不要复制，不要上传
id_ed25519.pub  公钥，复制这一份到 DigitalOcean
```

如果你使用默认 `ssh-keygen`，文件名也可能是 `id_rsa.pub` 或其他名字，以自己终端实际输出为准。核心原则只有一个：复制 `.pub` 文件，不要复制没有 `.pub` 的私钥文件。

![复制公钥内容](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609185858632.png)

把公钥内容粘贴到 DigitalOcean 的 SSH key 输入框里，并保存。

![选择已添加的 SSH 密钥](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609190259794.png)

## 创建服务器

确认地区、系统、套餐和 SSH 密钥都没问题后，点击 Create Droplet。

![点击创建服务器](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609190316767.png)

创建完成后，控制台会显示 Droplet 的公网 IP。

![Droplet 创建中](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609190642206.png)

服务器就绪后，可以用 SSH 连接：

```powershell
ssh root@服务器公网IP
```

第一次连接会提示确认主机指纹，确认 IP 没填错后输入 `yes`。

![Droplet 创建完成](https://kyroqu.xyz/blog-images-1/posts/digitalocean-free-vps/image-20260609191437781.png)

## 成本检查

创建成功后，最好立刻做三件事：

1. 回到 Billing 页面确认 Credits 仍然存在，并观察本月预计费用。
2. 记录 Droplet 的月费、创建时间和到期前要不要销毁。
3. 不用时不要只关机。DigitalOcean 的 CPU Droplet 关机后仍然会计费，因为资源还被保留；真正停止计费需要销毁 Droplet。

如果只是短期测试，测完就销毁。长期使用的话，可以定期检查 Billing、Snapshots、Volumes、Reserved IP 等资源，避免产生自己没注意到的费用。

## 参考资料

- [GitHub Student Developer Pack](https://education.github.com/pack)
- [DigitalOcean Billing 文档](https://docs.digitalocean.com/platform/billing/)
- [DigitalOcean Droplet Pricing 文档](https://docs.digitalocean.com/products/droplets/details/pricing/)
- [DigitalOcean Payment Methods 文档](https://docs.digitalocean.com/platform/billing/manage-payment-methods/)
