#!/usr/bin/env node

/**
 * 生成占位图片脚本
 * 使用 Canvas 生成简单的占位图片
 */

import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PHOTOS_DIR = path.join(__dirname, '../src/photos')

// 确保目录存在
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true })
}

// 生成占位图片
function generatePlaceholder(filename, width = 800, height = 600) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // 添加文字
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Placeholder', width / 2, height / 2)

  // 保存为 WebP
  const buffer = canvas.toBuffer('image/webp', { quality: 0.8 })
  const filepath = path.join(PHOTOS_DIR, filename)
  fs.writeFileSync(filepath, buffer)
  console.log(`✓ Generated: ${filename}`)
}

// 生成示例占位图片
console.log('Generating placeholder images...\n')
generatePlaceholder('placeholder-1.webp')
console.log('\n✓ Done!')
