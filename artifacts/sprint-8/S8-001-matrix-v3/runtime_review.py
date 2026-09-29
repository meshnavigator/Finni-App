from pathlib import Path
from PIL import Image,ImageDraw
p=Path(__file__).resolve().parent
out=Image.new('RGB',(780,760),'#faf5eb');d=ImageDraw.Draw(out)
for row,shape in enumerate(['round','floppy']):
 for col,pattern in enumerate(['plain','spots','stripes']):
  im=Image.open(p/'runtime'/f'{shape}-{pattern}-home.png').crop((410,945,695,1260)).resize((240,265));x=col*260;y=row*380;out.paste(im,(x+10,y+30));d.text((x+12,y+10),shape+'/'+pattern,fill='#253a44')
out.save(p/'runtime/six-home-review.jpg')
