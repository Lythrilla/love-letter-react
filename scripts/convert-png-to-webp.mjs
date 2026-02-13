import sharp from 'sharp'
import { readdir, stat, rename, unlink } from 'fs/promises'
import { join } from 'path'

const photosDir = './src/photos'

const targetFiles = [
  'IMG_20250816_203338', 'IMG_20250816_203316', 'Screenshot_2025-12-13-17-53-33-54_2332cb9b27b851b548ba47a91682926c',
  'IMG_20250816_203252', 'Screenshot_2025-08-11-22-56-16-25_e39d2c7de19156b0683cd93e8735f348',
  'Screenshot_2025-08-21-22-09-44-78_e39d2c7de19156b0683cd93e8735f348', 'mmexport1747979800210',
  'Screenshot_2025-08-21-22-09-46-39_e39d2c7de19156b0683cd93e8735f348', 'Screenshot_2025-11-29-09-04-18-02_e39d2c7de19156b0683cd93e8735f348',
  'IMG_20250816_203021', 'Screenshot_2025-09-24-22-57-39-17_e39d2c7de19156b0683cd93e8735f348', 'IMG_20250816_192337',
  'Screenshot_2025-11-15-22-05-40-48_e39d2c7de19156b0683cd93e8735f348', 'Image_1762450556259', 'mmexport1762820430585',
  'Screenshot_2025-08-29-14-29-17-82_e39d2c7de19156b0683cd93e8735f348', 'IMG_20250816_203518',
  'Screenshot_2025-08-26-19-33-00-01_e39d2c7de19156b0683cd93e8735f348', 'Screenshot_2025-08-21-23-44-38-42_e39d2c7de19156b0683cd93e8735f348',
  'Screenshot_2025-08-24-01-33-06-49_e39d2c7de19156b0683cd93e8735f348', 'IMG_20250816_192204', 'IMG_20250816_192721',
  'IMG_20250816_191543', 'Screenshot_2025-08-23-08-51-28-13_e39d2c7de19156b0683cd93e8735f348',
  'Screenshot_2025-08-24-01-36-12-30_e39d2c7de19156b0683cd93e8735f348', 'IMG20250704102740',
  'Screenshot_2025-12-13-17-53-09-73_2332cb9b27b851b548ba47a91682926c', 'IMG20250704102747', 'mmexport1763266849170',
  'Image_1762825136754', 'Screenshot_2025-11-01-10-22-43-01_e39d2c7de19156b0683cd93e8735f348',
  'Screenshot_2025-09-14-10-52-21-18_e39d2c7de19156b0683cd93e8735f348', 'mmexport1762820395074',
  'Screenshot_2025-10-23-22-36-16-00_e39d2c7de19156b0683cd93e8735f348', 'mmexport1748146232623', 'Image_1762825128333',
  'IMG_20250901_002846', 'Screenshot_2025-11-15-19-39-22-58_e39d2c7de19156b0683cd93e8735f348', 'mmexport1762820463598',
  'mmexport1748146146303', 'Screenshot_2025-12-13-23-33-59-11_9d26c6446fd7bb8e41d99b6262b17def', 'mmexport1754194107558',
  'mmexport1762820373334', 'mmexport1762820358762', 'Image_1762825175420', 'mmexport1762820326119',
  'Screenshot_2025-08-29-10-27-45-30_e39d2c7de19156b0683cd93e8735f348', 'IMG_20250816_191946', 'mmexport1762820297809',
  'Image_1762824795646', 'Image_1762824803033', 'IMG20250710142505', 'Image_1765692512435', 'IMG20250704102619'
]

async function compressTargetFiles() {
  const files = await readdir(photosDir)
  const webpFiles = files.filter(f => {
    const name = f.replace('.webp', '')
    return targetFiles.includes(name)
  })
  
  console.log(`找到 ${webpFiles.length} 个目标文件\n`)
  
  let totalBefore = 0
  let totalAfter = 0
  
  for (const file of webpFiles) {
    const filePath = join(photosDir, file)
    const fileInfo = await stat(filePath)
    const sizeKB = fileInfo.size / 1024
    totalBefore += fileInfo.size
    
    try {
      const tempPath = filePath + '.tmp'
      
      // 有损压缩，质量80，限宽1440
      const info = await sharp(filePath)
        .resize({ width: 1440, withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toFile(tempPath)
      
      const { copyFile } = await import('fs/promises')
      await copyFile(tempPath, filePath)
      await unlink(tempPath)
      totalAfter += info.size
      
      const reduction = ((fileInfo.size - info.size) / fileInfo.size * 100).toFixed(1)
      console.log(`✓ ${file}: ${sizeKB.toFixed(0)}KB -> ${(info.size/1024).toFixed(0)}KB (-${reduction}%)`)
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`)
      totalAfter += fileInfo.size
    }
  }
  
  console.log(`\n总计: ${(totalBefore/1024/1024).toFixed(2)}MB -> ${(totalAfter/1024/1024).toFixed(2)}MB`)
  console.log(`节省: ${((totalBefore - totalAfter)/1024/1024).toFixed(2)}MB`)
}

compressTargetFiles()
