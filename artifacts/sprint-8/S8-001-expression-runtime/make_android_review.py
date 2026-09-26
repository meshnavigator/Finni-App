"""Build a contact sheet from the 27 Android API 26 screenshots."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
shapes = ("pointy", "round", "floppy")
patterns = ("plain", "spots", "stripes")
cell_w, cell_h = 320, 205
sheet = Image.new("RGB", (cell_w * 9, cell_h * 3), "white")
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default()
for stage in (1, 2, 3):
    for index, (shape, pattern) in enumerate((s, p) for s in shapes for p in patterns):
        source = Image.open(root / "matrix" / f"{shape}-{pattern}-stage{stage}.png").convert("RGB")
        room = source.crop((35, 690, 1045, 1235)).resize((320, 173), Image.Resampling.LANCZOS)
        x, y = index * cell_w, (stage - 1) * cell_h
        sheet.paste(room, (x, y + 24))
        draw.text((x + 8, y + 5), f"{shape}/{pattern}  stage {stage}", fill="#14324A", font=font)
sheet.save(root / "android-9x3-room.jpg", quality=86, optimize=True)
