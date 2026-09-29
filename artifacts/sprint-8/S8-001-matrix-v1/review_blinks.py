from pathlib import Path
from PIL import Image,ImageDraw
import json
p=Path('artifacts/sprint-8/S8-001-matrix-v1');m=json.loads((p/'manifest.json').read_text(encoding='utf-8'));out=Image.new('RGB',(1020,1410),'#faf5eb');d=ImageDraw.Draw(out)
for i,v in enumerate(m['variants']):
 im=Image.open(p/'variants'/v['id']/'blink.png').crop((230,680,740,1320));im.thumbnail((330,414));x=(i%3)*340;y=(i//3)*470;out.paste(im,(x+5,y+40),im);d.text((x+12,y+12),v['id']+' blink',fill='#203644')
out.resize((680,940)).save(p/'review/blink-nine.jpg')
