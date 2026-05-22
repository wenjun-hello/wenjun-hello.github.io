# Royal Arcana — AI 塔罗自我觉察

## 项目简介

这是一个结合塔罗抽牌、手势互动、动态舞会视觉和 AI 追问解读的网页项目。

用户可以在一个优雅的舞会沙龙氛围中选择问题、洗牌抽牌、查看牌面解读，并通过 AI 继续追问更深层的问题。

## 主要功能

- **塔罗抽牌** — 单张牌或三张牌阵，扇形展开后点击或手势选择
- **手势洗牌与翻牌** — 基于 MediaPipe Hands 的摄像头手势交互
- **原始问题输入** — 抽牌前可写下想理解的问题
- **AI 深度追问** — 调用 DeepSeek API 生成个性化追问解读
- **多轮追问上下文** — 追问请求携带原始问题、牌面信息和追问历史
- **正位 / 逆位支持** — 每张牌随机分配方向（70% 正位 / 30% 逆位）
- **每日 AI 追问次数限制** — 前端 localStorage 限制每日 3 次 AI 追问
- **动态舞会视觉** — Ken Burns 动画背景、5 层运动系统、呼吸感氛围

## 技术栈

- Next.js（静态导出，部署于 GitHub Pages）
- React + TypeScript
- Tailwind CSS
- Framer Motion
- MediaPipe Hands（手势识别）
- Vercel Serverless Function（AI 后端）
- DeepSeek API
- GitHub Pages

## 线上地址

https://wenjun-hello.github.io

## 后端接口

https://tarot-ai-backend.vercel.app/api/follow-up

## 注意事项

DeepSeek API Key 只保存在 Vercel 后端环境变量中，不会暴露在前端代码里。
