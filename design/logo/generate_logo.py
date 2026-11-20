#!/usr/bin/env python3
"""生成「打一杯」小程序头像（设计规范色见 PRODUCT_DESIGN.md §8.1）。

三版设计（1024×1024，微信上传后按圆形裁剪，关键元素均居中于安全区）：
  A logo-a-green.png   绿底米色杯 + 豆黄液面（主推，深底在小尺寸下最醒目）
  B logo-b-cream.png   米色底绿色杯（浅底变体）
  C logo-c-text.png    绿底文字版「打一杯」+ 波浪下划线
4x 超采样绘制后 LANCZOS 缩回，保证边缘平滑。
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent
S = 4  # supersample
SIZE = 1024
W = SIZE * S

GREEN = (47, 125, 91, 255)       # #2F7D5B 主色
CREAM = (247, 243, 234, 255)     # #F7F3EA 辅色
YELLOW = (224, 164, 88, 255)     # #E0A458 点缀豆黄
YELLOW_LIGHT = (243, 217, 172, 255)
TEXT_SECONDARY = (38, 49, 44, 255)


def new_canvas(bg):
    img = Image.new("RGBA", (W, W), bg)
    return img, ImageDraw.Draw(img)


def draw_glass(draw, glass_fill, liquid_color, bubble_color, detail_color):
    """杯子：圆角矩形杯身 + 正弦液面 + 气泡。坐标基于 1024 设计稿 * S。"""
    s = S
    # 杯身（底部圆角更大，模拟玻璃杯）
    x0, y0, x1, y1 = 362 * s, 350 * s, 662 * s, 742 * s
    draw.rounded_rectangle([x0, y0, x1, y1], radius=30 * s, fill=glass_fill)

    # 液体：杯内缩，顶部为两段正弦波
    lx0, ly1 = x0 + 20 * s, y1 - 22 * s
    lx1 = x1 - 20 * s
    y_liquid = 566 * s
    amp = 14 * s
    pts = []
    steps = 120
    for i in range(steps + 1):
        x = lx0 + (lx1 - lx0) * i / steps
        y = y_liquid + amp * math.sin(i / steps * math.pi * 2.2 + 0.4)
        pts.append((x, y))
    pts += [(lx1, ly1), (lx0, ly1)]
    draw.polygon(pts, fill=liquid_color)

    # 气泡（液体里的两个小圆）
    draw.ellipse([448 * s, 632 * s, 468 * s, 652 * s], fill=bubble_color)
    draw.ellipse([556 * s, 606 * s, 570 * s, 620 * s], fill=bubble_color)

    # 杯口高光条（增强玻璃感）
    draw.rounded_rectangle(
        [x0 + 26 * s, y0 + 22 * s, x0 + 40 * s, y0 + 200 * s],
        radius=7 * s,
        fill=detail_color,
    )


def draw_bean(img, bean_fill, eye_color, center, angle, size=(150, 100)):
    """豆子：旋转的椭圆 + 豆眼弧线，营造“跳出杯口”的动感。"""
    s = S
    bw, bh = size[0] * s, size[1] * s
    bean = Image.new("RGBA", (bw + 8 * s, bh + 8 * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(bean)
    d.ellipse([0, 0, bw, bh], fill=bean_fill)
    # 豆眼：中间的弧线
    d.arc([bw * 0.3, bh * 0.25, bw * 0.7, bh * 0.75], start=200, end=340,
          fill=eye_color, width=int(7 * s))
    bean = bean.rotate(angle, expand=True, resample=Image.BICUBIC)
    cx, cy = center[0] * s, center[1] * s
    img.alpha_composite(bean, (int(cx - bean.width / 2), int(cy - bean.height / 2)))


def draw_sparkle(draw, center, size, color):
    """四芒星点缀。"""
    s = S
    cx, cy = center[0] * s, center[1] * s
    r = size * s
    k = r * 0.28
    pts = [
        (cx, cy - r), (cx + k, cy - k), (cx + r, cy), (cx + k, cy + k),
        (cx, cy + r), (cx - k, cy + k), (cx - r, cy), (cx - k, cy - k),
    ]
    draw.polygon(pts, fill=color)


def draw_wave_strip(draw, color, y_center, x0, x1, amp, thickness):
    """波浪细条（文字版下划线）。"""
    s = S
    top, bot = [], []
    steps = 140
    for i in range(steps + 1):
        x = x0 * s + (x1 - x0) * s * i / steps
        y = y_center * s + amp * s * math.sin(i / steps * math.pi * 2.4)
        top.append((x, y - thickness * s / 2))
        bot.append((x, y + thickness * s / 2))
    draw.polygon(top + bot[::-1], fill=color)


def load_font(size):
    for candidate, index in [
        ("/System/Library/Fonts/STHeiti Medium.ttc", 0),
        ("/System/Library/Fonts/Hiragino Sans GB.ttc", 1),
    ]:
        try:
            return ImageFont.truetype(candidate, size, index=index)
        except Exception:
            continue
    raise RuntimeError("no CJK font found")


def save(img, name):
    out = OUT / name
    img = img.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    img.save(out, "PNG")
    # 144px 小尺寸预览（模拟微信列表中的实际显示效果）
    small = OUT / name.replace(".png", "-144.png")
    img.resize((144, 144), Image.LANCZOS).save(small, "PNG")
    print("saved", out.name)


# --- A：绿底图标版（主推） ---
img, draw = new_canvas(GREEN)
draw_glass(draw, glass_fill=CREAM, liquid_color=YELLOW,
           bubble_color=CREAM, detail_color=(255, 255, 255, 70))
draw_bean(img, bean_fill=CREAM, eye_color=GREEN, center=(672, 296), angle=-28)
draw_sparkle(draw, (318, 268), 26, CREAM)
draw_sparkle(draw, (724, 452), 16, YELLOW_LIGHT)
save(img, "logo-a-green.png")

# --- B：米色底亮色版 ---
img, draw = new_canvas(CREAM)
draw_glass(draw, glass_fill=GREEN, liquid_color=YELLOW,
           bubble_color=CREAM, detail_color=(255, 255, 255, 60))
draw_bean(img, bean_fill=GREEN, eye_color=CREAM, center=(672, 296), angle=-28)
draw_sparkle(draw, (318, 268), 26, YELLOW)
draw_sparkle(draw, (724, 452), 16, GREEN)
save(img, "logo-b-cream.png")

# --- C：文字版 ---
img, draw = new_canvas(GREEN)
font = load_font(300 * S)
bbox = draw.textbbox((0, 0), "打一杯", font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text(((W - tw) / 2 - bbox[0], 400 * S - th / 2 - bbox[1]), "打一杯",
          font=font, fill=CREAM)
draw_wave_strip(draw, YELLOW, y_center=700, x0=312, x1=712, amp=16, thickness=22)
draw_sparkle(draw, (168, 232), 24, YELLOW)
draw_sparkle(draw, (872, 244), 16, CREAM)
save(img, "logo-c-text.png")

# --- 预览拼图（评估用，非上传素材） ---
files = ["logo-a-green.png", "logo-b-cream.png", "logo-c-text.png"]
cell, gap, pad = 420, 40, 60
row = len(files) * cell + (len(files) - 1) * gap
sheet = Image.new("RGB", (pad * 2 + row, pad * 2 + cell * 2 + gap + 120), (250, 250, 250))
for i, f in enumerate(files):
    im = Image.open(OUT / f).convert("RGB")
    big = im.resize((cell, cell), Image.LANCZOS)
    small = im.resize((144, 144), Image.LANCZOS)
    x = pad + i * (cell + gap)
    sheet.paste(big, (x, pad))
    sheet.paste(small, (x + (cell - 144) // 2, pad + cell + gap))
sheet.save(OUT / "preview.png")
print("saved preview.png")
