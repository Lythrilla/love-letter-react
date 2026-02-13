#!/usr/bin/env node

/**
 * 生成人像占位图片
 */

import sharp from 'sharp'
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

// 生成人像占位图（竖版）
async function generatePortrait() {
  const width = 600
  const height = 800
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
      
      <!-- 人像轮廓 -->
      <circle cx="${width/2}" cy="${height/2 - 50}" r="80" fill="rgba(255,255,255,0.2)" />
      <ellipse cx="${width/2}" cy="${height/2 + 80}" rx="100" ry="120" fill="rgba(255,255,255,0.2)" />
      
      <text x="50%" y="${height - 100}" font-family="Arial" font-size="32" 
            fill="rgba(255,255,255,0.3)" text-anchor="middle" dominant-baseline="middle">
        Portrait
      </text>
      <text x="50%" y="${height - 60}" font-family="Arial" font-size="20" 
            fill="rgba(255,255,255,0.2)" text-anchor="middle" dominant-baseline="middle">
        ${width} × ${height}
      </text>
    </svg>
  `

  const filepath = path.join(PHOTOS_DIR, 'baobao.webp')
  
  await sharp(Buffer.from(svg))
    .webp({ quality: 80 })
    .toFile(filepath)
  
  console.log(`✓ Generated: baobao.webp (portrait placeholder)`)
}

generatePortrait().catch(console.error)
