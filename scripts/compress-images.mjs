import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'

const PHOTOS_DIR = './src/photos'
const MAX_WIDTH = 1600  // 最大宽度
const MAX_HEIGHT = 1600 // 最大高度
const QUALITY = 85      // JPEG 质量（更高质量）

async function compressImages() {
  console.log('开始压缩图片...')
  
  const files = await readdir(PHOTOS_DIR)
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  
  let totalSaved = 0
  let processed = 0
  
  for (const file of imageFiles) {
    const filePath = join(PHOTOS_DIR, file)
    const ext = extname(file).toLowerCase()
    
    try {
      const originalStats = await stat(filePath)
      const originalSize = originalStats.size
      
      // 读取图片
      let image = sharp(filePath)
      const metadata = await image.metadata()
      
      // 如果图片太大，缩放
      if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        image = image.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
      
      // 根据格式压缩
      let buffer
      if (ext === '.png') {
        buffer = await image.png({ quality: QUALITY, compressionLevel: 9 }).toBuffer()
      } else if (ext === '.webp') {
        buffer = await image.webp({ quality: QUALITY }).toBuffer()
      } else {
        // jpg/jpeg
        buffer = await image.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer()
      }
      
      // 只有压缩后更小才保存
      if (buffer.length < originalSize) {
        await sharp(buffer).toFile(filePath)
        const saved = originalSize - buffer.length
        totalSaved += saved
        console.log(`✓ ${file}: ${(originalSize / 1024).toFixed(1)}KB -> ${(buffer.length / 1024).toFixed(1)}KB (省 ${(saved / 1024).toFixed(1)}KB)`)
      } else {
        console.log(`- ${file}: 已是最优`)
      }
      
      processed++
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`)
    }
  }
  
  console.log(`\n完成! 处理 ${processed} 张图片，共节省 ${(totalSaved / 1024 / 1024).toFixed(2)}MB`)
}

compressImages().catch(console.error)
