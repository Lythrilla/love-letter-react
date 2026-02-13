#!/usr/bin/env python3
"""
生成占位图片脚本
使用 PIL/Pillow 生成简单的占位图片
运行: python scripts/generate-placeholder.py
"""

import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("请先安装 Pillow: pip install Pillow")
    exit(1)

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
PHOTOS_DIR = ROOT_DIR / "src" / "photos"

# 确保目录存在
PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

def generate_placeholder(filename, width=800, height=600):
    """生成占位图片"""
    # 创建渐变背景
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # 简单的渐变效果
    for y in range(height):
        # 从紫色到粉色的渐变
        r = int(102 + (118 - 102) * y / height)
        g = int(126 + (75 - 126) * y / height)
        b = int(234 + (162 - 234) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # 添加文字
    try:
        font = ImageFont.truetype("arial.ttf", 48)
    except:
        font = ImageFont.load_default()
    
    text = "Placeholder"
    # 获取文字边界框
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # 居中绘制文字
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    draw.text((x, y), text, fill=(255, 255, 255, 77), font=font)
    
    # 保存为 WebP
    filepath = PHOTOS_DIR / filename
    img.save(filepath, 'WEBP', quality=80)
    print(f"✓ Generated: {filename}")

if __name__ == "__main__":
    print("Generating placeholder images...\n")
    generate_placeholder('placeholder-1.webp')
    print("\n✓ Done!")
    print(f"\nImages saved to: {PHOTOS_DIR}")
