from pathlib import Path
from PIL import Image,ImageDraw
p=Path('artifacts/sprint-8/S8-001-spots-runtime')
canvas=Image.new('RGB',(980,540),'#faf7f0');d=ImageDraw.Draw(canvas)
for i,(name,label) in enumerate([('constructor-plain.png','Constructor plain'),('constructor-spots.png','Constructor spots'),('home-plain.png','Home plain'),('home-final.png','Home spots')]):
 im=Image.open(p/name).convert('RGB'); box=(370,210,710,535) if i<2 else (430,970,650,1220); im=im.crop(box); im.thumbnail((225,450)); canvas.paste(im,(i*245+(245-im.width)//2,45));d.text((i*245+12,15),label,fill='#173b4b')
canvas.save(p/'runtime-appearance-comparison.jpg')
