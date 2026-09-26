from pathlib import Path
import subprocess,json
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
exec((P/'runtime_smoke.py').read_text(encoding='utf-8').split("shapes=[")[0])
old=adb('shell','settings','get','global','transition_animation_scale').decode().strip()
try:
 adb('shell','settings','put','global','transition_animation_scale','1')
 for shape,label in [('floppy','Мягкие'),('round','Круглые')]:
  # UI selection while animations are temporarily off guarantees idle snapshots.
  adb('shell','settings','put','global','transition_animation_scale','0')
  tap('О питомце: Финни');tap(label);tap('Полоски');tap('Готово');ui()
  adb('shell','settings','put','global','transition_animation_scale','1')
  adb('shell','screenrecord','--time-limit','8',f'/sdcard/{shape}-seams-v3.mp4')
  adb('pull',f'/sdcard/{shape}-seams-v3.mp4',str(OUT/f'{shape}-blink.mp4'))
  frames=OUT/(shape+'-frames');frames.mkdir(exist_ok=True)
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(OUT/f'{shape}-blink.mp4'),'-vf','fps=12',str(frames/'%03d.png')],check=True)
  sheet=Image.new('RGB',(1200,((len(list(frames.glob('*.png')))+9)//10)*150),'#faf5eb');d=ImageDraw.Draw(sheet)
  for i,f in enumerate(sorted(frames.glob('*.png'))):
   im=Image.open(f).crop((410,945,695,1260));im.thumbnail((115,130));x=(i%10)*120;y=(i//10)*150;sheet.paste(im,(x,y+15));d.text((x,y),str(i),fill='black')
  sheet.save(OUT/f'{shape}-blink-contact.jpg')
finally:adb('shell','settings','put','global','transition_animation_scale',old)
(OUT/'blink-recording.json').write_text(json.dumps({'recorded':['round','floppy'],'secondsEach':8,'sampleFps':12,'motionSettingRestored':old,'visualReview':'required'},indent=2))
