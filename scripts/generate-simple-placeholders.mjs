#!/usr/bin/env node

/**
 * 生成简单的占位图片（使用 sharp）
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

// 生成渐变色占位图
async function generatePlaceholder(filename, width = 800, height = 600, color1 = '#667eea', color2 = '#764ba2') {
  // 创建 SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
      <text x="50%" y="50%" font-family="Arial" font-size="${Math.min(width, height) / 15}" 
            fill="rgba(255,255,255,0.3)" text-anchor="middle" dominant-baseline="middle">
        Placeholder
      </text>
      <text x="50%" y="${height / 2 + Math.min(width, height) / 10}" font-family="Arial" 
            font-size="${Math.min(width, height) / 30}" fill="rgba(255,255,255,0.2)" 
            text-anchor="middle" dominant-baseline="middle">
        ${width} × ${height}
      </text>
    </svg>
  `

  const filepath = path.join(PHOTOS_DIR, filename)
  
  await sharp(Buffer.from(svg))
    .webp({ quality: 80 })
    .toFile(filepath)
  
  console.log(`✓ Generated: ${filename}`)
}

// 生成多个占位图片
async function main() {
  console.log('Generating placeholder images...\n')
  
  const colors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef'],
    ['#ffecd2', '#fcb69f'],
    ['#ff6e7f', '#bfe9ff'],
    ['#e0c3fc', '#8ec5fc'],
  ]
  
  // 生成 100 张占位图
  for (let i = 0; i < 100; i++) {
    const colorPair = colors[i % colors.length]
    await generatePlaceholder(
      `placeholder-${i + 1}.webp`,
      800,
      600,
      colorPair[0],
      colorPair[1]
    )
  }
  
  // 生成人像占位图
  console.log('\nGenerating portrait placeholder...')
  await generatePortrait()
  
  console.log(`\n✓ Done! Generated 100 placeholder images + 1 portrait.`)
  console.log('\nNext steps:')
  console.log('1. Check src/photos/ directory')
  console.log('2. Configure stories in src/config/photoStories.ts')
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
  
  console.log(`✓ Generated: baobao.webp (portrait)`)
}

main().catch(console.error)
