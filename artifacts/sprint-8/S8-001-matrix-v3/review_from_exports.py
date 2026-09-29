from pathlib import Path
from PIL import Image,ImageDraw
import json
p=Path(__file__).resolve().parent
for frame in ['neutral','blink']:
 out=Image.new('RGB',(1000,760),'#f3eee2');d=ImageDraw.Draw(out)
 for row,shape in enumerate(['round','floppy']):
  for col,rev in enumerate(['S8-001-matrix-v2','S8-001-matrix-v3']):
   im=Image.open(p.with_name(rev)/'variants'/f'{shape}-plain'/f'{frame}.png').crop((235,675,735,1035));out.paste(im,(col*500,row*380+20),im);d.text((col*500+12,row*380+4),shape+(' BEFORE' if col==0 else ' AFTER'),fill='#253a44')
 out.save(p/'review'/f'ear-fit-{frame}-before-after.jpg')
 if frame=='neutral':out.save(p/'review/ear-fit-before-after.jpg')
