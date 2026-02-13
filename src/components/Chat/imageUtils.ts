// 图片压缩工具 - WebP 格式

const MAX_BYTES = 380 * 1024 // 380KB (留一点余量给加密)
const MAX_DIMENSION = 1200   // 最大边长

// 计算 base64 数据的实际字节大小
function getBase64Size(base64: string): number {
  const base64Data = base64.split(',')[1] || base64
  return Math.ceil(base64Data.length * 3 / 4)
}

export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        let { width, height } = img
        
        // 先缩放到最大尺寸
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // 使用 WebP 格式（更好的压缩率）
        let quality = 0.92
        let scale = 1
        let result = ''
        
        for (let attempt = 0; attempt < 10; attempt++) {
          canvas.width = Math.floor(width * scale)
          canvas.height = Math.floor(height * scale)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          result = canvas.toDataURL('image/webp', quality)
          const size = getBase64Size(result)
          console.log(`WebP 尝试 ${attempt + 1}: ${Math.round(size / 1024)}KB, 质量=${quality.toFixed(2)}, 尺寸=${canvas.width}x${canvas.height}`)
          
          if (size <= MAX_BYTES) {
            break
          }
          
          // 先降低质量
          if (quality > 0.5) {
            quality -= 0.1
          } else {
            // 缩小尺寸，重置质量
            scale *= 0.75
            quality = 0.85
          }
        }
        
        resolve(result)
      }
      
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export function isValidImageType(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
}
