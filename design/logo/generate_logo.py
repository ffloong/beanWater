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


def draw_mug(draw, body_fill, liquid_color, swirl_color, handle_color, hole_color,
             highlight_color, liquid_top_color=None, swirl_width=9):
    """微俯视马克杯：椭圆杯口可见液面 + 右侧把手（参考用户提供的样式）。

    绘制顺序：把手 → 杯身 → 杯口沿 → 内壁洞 → 液面（可选上层奶盖）→ 奶漩 → 高光。
    衔接要点：杯身矩形底边与底部椭圆最宽处（y=667）平齐，轮廓无台阶；
    把手用粗弧线绘制，两端藏进杯身，无尖刺。
    """
    s = S
    # 1. 把手：粗弧线 C 形。PIL 弧线描边自轮廓向内延伸，端点径向切口需完全
    #    藏进杯身（x<=694）：内径 48 → 角度 >=142.3°，取 ±150° 留余量
    draw.arc([640 * s, 388 * s, 824 * s, 606 * s], start=-150, end=150,
             fill=handle_color, width=int(44 * s))

    # 2. 杯身：直筒矩形 + 底部圆弧鼓肚（矩形底边 = 椭圆最宽处，平滑衔接）
    draw.rectangle([330 * s, 370 * s, 694 * s, 667 * s], fill=body_fill)
    draw.ellipse([330 * s, 606 * s, 694 * s, 728 * s], fill=body_fill)

    # 3. 杯口沿（比杯身略宽，形成唇边）
    draw.ellipse([312 * s, 308 * s, 712 * s, 442 * s], fill=body_fill)
    # 4. 内壁（露出的杯口“洞”）
    draw.ellipse([338 * s, 326 * s, 686 * s, 424 * s], fill=hole_color)
    # 5. 液面（比洞再小一圈，明显看出有液体）
    draw.ellipse([358 * s, 338 * s, 666 * s, 412 * s], fill=liquid_color)
    if liquid_top_color is not None:
        # 上层“奶盖”：液面上半弦月
        draw.pieslice([358 * s, 338 * s, 666 * s, 412 * s], start=180, end=360,
                      fill=liquid_top_color)
    # 6. 奶漩：液面上的弧线
    draw.arc([400 * s, 346 * s, 626 * s, 404 * s], start=120, end=340,
             fill=swirl_color, width=int(swirl_width * s))
    draw.arc([470 * s, 356 * s, 560 * s, 394 * s], start=150, end=330,
             fill=swirl_color, width=int(max(4, swirl_width - 3) * s))

    # 7. 杯身左侧高光竖条（缩短，远离轮廓边缘）
    draw.rounded_rectangle([356 * s, 480 * s, 378 * s, 616 * s],
                           radius=11 * s, fill=highlight_color)


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


# 食材色定义
SOYBEAN_YELLOW = (242, 201, 76, 255)   # 黄豆色 #F2C94C
RED_BEAN = (168, 67, 58, 255)          # 红豆色 #A8433A
MILK_WHITE = (251, 246, 234, 255)      # 米白液面 #FBF6EA

# --- A：绿底图标版（豆黄液 + 米白豆） ---
img, draw = new_canvas(GREEN)
draw_mug(draw, body_fill=CREAM, liquid_color=YELLOW, swirl_color=CREAM,
         handle_color=CREAM, hole_color=GREEN, highlight_color=(255, 255, 255, 255))
draw_bean(img, bean_fill=CREAM, eye_color=GREEN, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, CREAM)
draw_sparkle(draw, (786, 540), 16, YELLOW_LIGHT)
save(img, "logo-a-green.png")

# --- B：米色底亮色版（豆黄液 + 绿豆——米色豆会融进米色底，故保留绿豆） ---
img, draw = new_canvas(CREAM)
draw_mug(draw, body_fill=GREEN, liquid_color=YELLOW, swirl_color=CREAM,
         handle_color=GREEN, hole_color=CREAM, highlight_color=(86, 156, 126, 255))
draw_bean(img, bean_fill=GREEN, eye_color=CREAM, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, YELLOW)
draw_sparkle(draw, (786, 540), 16, GREEN)
save(img, "logo-b-cream.png")

# --- D：米白液体 + 黄豆色豆子 ---
img, draw = new_canvas(GREEN)
draw_mug(draw, body_fill=CREAM, liquid_color=MILK_WHITE, swirl_color=YELLOW,
         handle_color=CREAM, hole_color=GREEN, highlight_color=(255, 255, 255, 255),
         swirl_width=7)
draw_bean(img, bean_fill=SOYBEAN_YELLOW, eye_color=GREEN, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, CREAM)
draw_sparkle(draw, (786, 540), 16, YELLOW_LIGHT)
save(img, "logo-d-milk-soybean.png")

# --- E：米白液体 + 红豆色豆子 ---
img, draw = new_canvas(GREEN)
draw_mug(draw, body_fill=CREAM, liquid_color=MILK_WHITE, swirl_color=YELLOW,
         handle_color=CREAM, hole_color=GREEN, highlight_color=(255, 255, 255, 255),
         swirl_width=7)
draw_bean(img, bean_fill=RED_BEAN, eye_color=CREAM, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, CREAM)
draw_sparkle(draw, (786, 540), 16, YELLOW_LIGHT)
save(img, "logo-e-milk-redbean.png")

# --- F：红豆色液体 + 黄豆色豆子（红豆糊的感觉） ---
img, draw = new_canvas(GREEN)
draw_mug(draw, body_fill=CREAM, liquid_color=RED_BEAN, swirl_color=MILK_WHITE,
         handle_color=CREAM, hole_color=GREEN, highlight_color=(255, 255, 255, 255))
draw_bean(img, bean_fill=SOYBEAN_YELLOW, eye_color=GREEN, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, CREAM)
draw_sparkle(draw, (786, 540), 16, YELLOW_LIGHT)
save(img, "logo-f-redbean-drink.png")

# --- G：分层奶盖（豆黄液 + 米白奶盖） + 红豆色豆子 ---
img, draw = new_canvas(GREEN)
draw_mug(draw, body_fill=CREAM, liquid_color=YELLOW, swirl_color=YELLOW,
         handle_color=CREAM, hole_color=GREEN, highlight_color=(255, 255, 255, 255),
         liquid_top_color=MILK_WHITE)
draw_bean(img, bean_fill=RED_BEAN, eye_color=CREAM, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, CREAM)
draw_sparkle(draw, (786, 540), 16, YELLOW_LIGHT)
save(img, "logo-g-layered.png")

# --- 浅底深杯系列（logo-b-cream 风格：米色背景 + 绿杯） ---

# --- H：米色底 + 绿杯 + 米白液 + 黄豆色豆子 ---
img, draw = new_canvas(CREAM)
draw_mug(draw, body_fill=GREEN, liquid_color=MILK_WHITE, swirl_color=YELLOW,
         handle_color=GREEN, hole_color=CREAM, highlight_color=(86, 156, 126, 255),
         swirl_width=7)
draw_bean(img, bean_fill=SOYBEAN_YELLOW, eye_color=GREEN, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, YELLOW)
draw_sparkle(draw, (786, 540), 16, GREEN)
save(img, "logo-h-cream-milk-soybean.png")

# --- I：米色底 + 绿杯 + 米白液 + 红豆色豆子 ---
img, draw = new_canvas(CREAM)
draw_mug(draw, body_fill=GREEN, liquid_color=MILK_WHITE, swirl_color=YELLOW,
         handle_color=GREEN, hole_color=CREAM, highlight_color=(86, 156, 126, 255),
         swirl_width=7)
draw_bean(img, bean_fill=RED_BEAN, eye_color=CREAM, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, YELLOW)
draw_sparkle(draw, (786, 540), 16, GREEN)
save(img, "logo-i-cream-milk-redbean.png")

# --- J：米色底 + 绿杯 + 红豆色液体 + 黄豆色豆子 ---
img, draw = new_canvas(CREAM)
draw_mug(draw, body_fill=GREEN, liquid_color=RED_BEAN, swirl_color=MILK_WHITE,
         handle_color=GREEN, hole_color=CREAM, highlight_color=(86, 156, 126, 255))
draw_bean(img, bean_fill=SOYBEAN_YELLOW, eye_color=GREEN, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, YELLOW)
draw_sparkle(draw, (786, 540), 16, GREEN)
save(img, "logo-j-cream-redbean-drink.png")

# --- K：米色底 + 绿杯 + 分层奶盖 + 红豆色豆子 ---
img, draw = new_canvas(CREAM)
draw_mug(draw, body_fill=GREEN, liquid_color=YELLOW, swirl_color=YELLOW,
         handle_color=GREEN, hole_color=CREAM, highlight_color=(86, 156, 126, 255),
         liquid_top_color=MILK_WHITE)
draw_bean(img, bean_fill=RED_BEAN, eye_color=CREAM, center=(748, 268), angle=-28)
draw_sparkle(draw, (300, 252), 26, YELLOW)
draw_sparkle(draw, (786, 540), 16, GREEN)
save(img, "logo-k-cream-layered.png")

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
files = [
    "logo-a-green.png", "logo-b-cream.png", "logo-c-text.png",
    "logo-d-milk-soybean.png", "logo-e-milk-redbean.png",
    "logo-f-redbean-drink.png", "logo-g-layered.png",
    "logo-h-cream-milk-soybean.png", "logo-i-cream-milk-redbean.png",
    "logo-j-cream-redbean-drink.png", "logo-k-cream-layered.png",
]
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
