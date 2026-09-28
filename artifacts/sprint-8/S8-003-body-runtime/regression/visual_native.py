from pathlib import Path
import subprocess,time,json
R=Path(__file__).resolve().parent
ADB=['C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe','-s','emulator-5554']
def adb(*args):return subprocess.check_output(ADB+list(args))
def tap(x,y):adb('shell','input','tap',str(x),str(y))
def shot(name):R.joinpath(name+'.png').write_bytes(adb('exec-out','screencap','-p'))
clips=[(3,100,1100,1500),(4,285,1100,1100),(5,470,1100,750),(6,660,1100,900),(7,850,1100,1100),(8,100,1200,1400),(9,285,1200,2000),(10,470,1200,1600),(11,660,1200,500),(12,850,1200,800),(13,100,1300,3000),(14,285,1300,2200)]
records=[]
rec=subprocess.Popen(ADB+['shell','screenrecord','--time-limit','55','/sdcard/finni-final-sweep.mp4'])
for n,x,y,ms in clips:
 tap(x,y);time.sleep(ms/2000);name=f'final-AN-{n:03d}';shot(name);time.sleep(ms/2000+.5)
 records.append({'clip':f'AN-{n:03d}','shape':'pointy','pattern':'plain','stage':2,'file':name+'.png','scope':'final sweep'})
 print(name,flush=True)
rec.wait(timeout=60);adb('pull','/sdcard/finni-final-sweep.mp4',str(R/'final-sweep-api26.mp4'))
# Current stage2 -> stage3 -> stage1; plain coat isolates head/neck geometry risk.
for stage in (3,1):
 tap(580,1650)
 for shape,sx in [('pointy',100),('round',285),('floppy',470)]:
  tap(sx,1420);time.sleep(.7)
  for n,x,y,ms in [c for c in clips if c[0] in (6,9,10,14)]:
   tap(x,y);time.sleep(ms/2000);name=f'risk-{shape}-s{stage}-AN-{n:03d}';shot(name);time.sleep(ms/2000+.5)
   records.append({'clip':f'AN-{n:03d}','shape':shape,'pattern':'plain','stage':stage,'file':name+'.png','scope':'head neck prop risk'})
   print(name,flush=True)
R.joinpath('visual-captures.json').write_text(json.dumps(records,indent=2))
R.joinpath('logcat-final.txt').write_bytes(adb('logcat','-d','-v','threadtime','ReactNativeJS:V','AndroidRuntime:E','*:S'))
