import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义需要生成的图标尺寸
const iconSizes = [
  { name: '32x32.png', width: 32, height: 32 },
  { name: '64x64.png', width: 64, height: 64 },
  { name: '128x128.png', width: 128, height: 128 },
  { name: '128x128@2x.png', width: 256, height: 256 },
  { name: 'icon.png', width: 512, height: 512 },
  // Windows Store logos
  { name: 'Square30x30Logo.png', width: 30, height: 30 },
  { name: 'Square44x44Logo.png', width: 44, height: 44 },
  { name: 'Square71x71Logo.png', width: 71, height: 71 },
  { name: 'Square89x89Logo.png', width: 89, height: 89 },
  { name: 'Square107x107Logo.png', width: 107, height: 107 },
  { name: 'Square142x142Logo.png', width: 142, height: 142 },
  { name: 'Square150x150Logo.png', width: 150, height: 150 },
  { name: 'Square284x284Logo.png', width: 284, height: 284 },
  { name: 'Square310x310Logo.png', width: 310, height: 310 },
  { name: 'StoreLogo.png', width: 50, height: 50 },
];

// 生成 SVG 心形图标
function generateHeartSVG(size) {
  const heartSize = size * 0.5;
  const centerX = size / 2;
  const centerY = size / 2;
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.2}" fill="rgba(255,255,255,0.1)"/>
      <circle cx="${size * 0.7}" cy="${size * 0.6}" r="${size * 0.15}" fill="rgba(255,255,255,0.1)"/>
      <circle cx="${size * 0.5}" cy="${size * 0.8}" r="${size * 0.18}" fill="rgba(255,255,255,0.1)"/>
      <path d="M ${centerX} ${centerY + heartSize * 0.3}
             C ${centerX} ${centerY},
               ${centerX - heartSize * 0.5} ${centerY - heartSize * 0.3},
               ${centerX} ${centerY - heartSize * 0.1}
             C ${centerX + heartSize * 0.5} ${centerY - heartSize * 0.3},
               ${centerX} ${centerY},
               ${centerX} ${centerY + heartSize * 0.3}
             Z"
             fill="rgba(255,255,255,0.5)"/>
    </svg>
  `;
}

async function generatePlaceholderIcon(width, height, outputPath) {
  const svg = generateHeartSVG(width);
  
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(outputPath);
}

async function main() {
  const iconsDir = path.join(__dirname, '../src-tauri/icons');

  console.log('🎨 开始生成占位符图标...\n');

  for (const { name, width, height } of iconSizes) {
    const outputPath = path.join(iconsDir, name);
    await generatePlaceholderIcon(width, height, outputPath);
    console.log(`✅ 生成: ${name} (${width}x${height})`);
  }

  console.log('\n✨ 所有图标生成完成！');
  console.log('\n⚠️  注意：');
  console.log('   - icon.ico 和 icon.icns 需要使用专门的工具转换');
  console.log('   - 建议使用 icon.png (512x512) 作为源文件');
  console.log('   - Windows: 可以使用在线工具 https://convertio.co/png-ico/');
  console.log('   - macOS: 可以使用在线工具 https://convertio.co/png-icns/');
  console.log('   - 或者使用 Tauri CLI 自动生成: npm run tauri icon path/to/icon.png');
}

main().catch(console.error);
