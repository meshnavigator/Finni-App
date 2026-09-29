
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
R=Path('artifacts/sprint-9/S9-001-structure');d=json.loads((R/'native-matrix.json').read_text(encoding='utf-8'))
rows={r['case']:r for r in d['results']}
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
for stage in (1,2,3):
    board=Image.new('RGB',(1104,1200),'#F6F0E6');draw=ImageDraw.Draw(board)
    for i,(shape,pattern) in enumerate(( (s,p) for s in ('pointy','round','floppy') for p in ('plain','spots','stripes'))):
        name=f'appearance-{shape}-{pattern}-{stage}';im=Image.open(R/'review'/(name+'.png'))
        box=rows[name]['boxes']['home-scene-space'];im=im.crop(tuple(box)).convert('RGB')
        im.thumbnail((360,368));x=(i%3)*368+(368-im.width)//2;y=(i//3)*400+26
        board.paste(im,(x,y));draw.text(((i%3)*368+12,(i//3)*400+4),f'{shape} / {pattern} / stage {stage}',font=font,fill='#3D352D')
    board.save(R/'review'/f'appearance-stage-{stage}.jpg',quality=93)
board=Image.new('RGB',(744,810),'#F6F0E6');draw=ImageDraw.Draw(board)
for i,(shape,pattern) in enumerate(( (s,p) for s in ('pointy','round','floppy') for p in ('plain','spots','stripes'))):
    name=f'portrait-{shape}-{pattern}';im=Image.open(R/'review'/(name+'.png'));box=rows[name]['boxes']['home-pet-target']
    im=im.crop(tuple(box)).resize((240,240),Image.Resampling.LANCZOS).convert('RGB');x=(i%3)*248+4;y=(i//3)*270+26
    board.paste(im,(x,y));draw.text((x,(i//3)*270+4),f'{shape} / {pattern}',font=font,fill='#3D352D')
board.save(R/'review'/'portraits.jpg',quality=93)
print('4 native review sheets created')

