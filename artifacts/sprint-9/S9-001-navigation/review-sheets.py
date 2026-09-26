from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
R=Path('artifacts/sprint-9/S9-001-navigation');V=R/'review';font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
roots=[('home','Домик'),('plan','План'),('shop','Покупки'),('savings','Копилка'),('more','Ещё')]
out=Image.new('RGB',(1300,598),'#F6F0E6');d=ImageDraw.Draw(out)
for i,(id,label) in enumerate(roots):
 im=Image.open(V/('root-'+id+'.png')).convert('RGB').resize((260,563),Image.Resampling.LANCZOS);out.paste(im,(i*260,35));d.text((i*260+12,8),label,font=font,fill='#3D352D')
out.save(V/'five-roots.jpg',quality=88)
rows=json.loads((R/'native-matrix.json').read_text(encoding='utf-8'))['results'];by={r['case']:r for r in rows}
for stage in (1,2,3):
 sheet=Image.new('RGB',(810,870),'#F6F0E6');d=ImageDraw.Draw(sheet)
 for i,(shape,pattern) in enumerate(( (a,b) for a in ('pointy','round','floppy') for b in ('plain','spots','stripes') )):
  name=f'appearance-{shape}-{pattern}-{stage}';im=Image.open(V/(name+'.png')).convert('RGB');box=by[name]['boxes']['home-scene-space'];im=im.crop(box);im.thumbnail((256,252),Image.Resampling.LANCZOS);x=(i%3)*270;y=(i//3)*290;sheet.paste(im,(x+(270-im.width)//2,y+32));d.text((x+8,y+7),f'{shape}/{pattern} · {stage}',font=font,fill='#3D352D')
 sheet.save(V/('appearances-stage-'+str(stage)+'.jpg'),quality=87)
p=R/'user-test.md';s=p.read_text(encoding='utf-8').replace('review/prototype-short.png','review/delivery-small.png').replace('review/root-more-1.png','review/root-more.png');p.write_text(s,encoding='utf-8')
print('Review sheets written')
