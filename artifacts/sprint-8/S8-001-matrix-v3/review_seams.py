from pathlib import Path
from PIL import Image,ImageDraw
p=Path(__file__).resolve().parent
regions=[('round','left',(275,765,435,905)),('round','right',(525,785,690,1000)),('floppy','left',(255,750,445,915)),('floppy','right',(550,795,705,1020))]
out=Image.new('RGB',(960,1840),'#f3eee2');d=ImageDraw.Draw(out)
for row,(shape,side,box) in enumerate(regions):
 for col,rev in enumerate(['S8-001-matrix-v2','S8-001-matrix-v3']):
  im=Image.open(p.with_name(rev)/'variants'/f'{shape}-plain'/'neutral.png').crop(box);im=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
  out.paste(im,(col*480+20,row*460+20),im);d.text((col*480+20,row*460+3),f'{shape} {side} '+('v2' if col==0 else 'v3'),fill='#263a44')
out.save(p/'review/four-seams-200pct.jpg')
