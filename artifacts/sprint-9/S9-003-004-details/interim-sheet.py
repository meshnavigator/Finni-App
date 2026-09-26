from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
r=Path('artifacts/sprint-9/S9-003-004-details/review');names=['catalog-final','pet-final','LS-B01-390-2-control','help-360-150-top','LS-P03-412-1.5-control','LS-P01-360-2-control']
f=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16);out=Image.new('RGB',(960,1260),'#E8DFD0');d=ImageDraw.Draw(out)
for i,name in enumerate(names):
 im=Image.open(r/(name+'.png')).convert('RGB');im.thumbnail((306,580));x=(i%3)*320+7;y=(i//3)*630+37;out.paste(im,(x,y));d.text((x,y-27),name,fill='#3D352D',font=f)
out.save(r/'interim-review.jpg',quality=90)
