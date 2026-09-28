"""Native presentation regression; no database access or domain mutations."""
from pathlib import Path
import subprocess,time,json
R=Path(__file__).resolve().parent
ADB=['C:/tmp/finni-s2-006-android-sdk/platform-tools/adb.exe','-s','emulator-5554']
records=[]
def adb(*args):return subprocess.check_output(ADB+list(args))
def tap(x,y):adb('shell','input','tap',str(x),str(y))
def shot(name):
 R.joinpath(name+'.png').write_bytes(adb('exec-out','screencap','-p'))
 records.append({'name':name,'time':time.time()})
def play(n):
 positions={3:(100,1100),4:(285,1100),5:(470,1100),6:(660,1100),7:(850,1100),8:(100,1200),9:(285,1200),10:(470,1200),11:(660,1200),12:(850,1200),13:(100,1300),14:(285,1300)}
 tap(*positions[n])
rec=subprocess.Popen(ADB+['shell','screenrecord','--time-limit','55','/sdcard/finni-regression.mp4'])
# Normal completion, then a result replacing an unfinished reaction.
play(6);time.sleep(1.8);shot('normal-finish')
play(6);time.sleep(.1);play(9);time.sleep(2.8);shot('replacement-finish')
# Rapid touch queue and an authoritative result take precedence.
adb('shell','for i in 1 2 3 4 5 6 7 8; do input tap 500 500; done')
play(9);tap(500,500);tap(500,500);shot('priority-result');time.sleep(2.8);shot('rapid-settled')
play(13);time.sleep(.15);tap(365,1650);time.sleep(.8);shot('modal-cancel');tap(365,1650);time.sleep(.4)
play(13);time.sleep(.15);adb('shell','input','keyevent','3');time.sleep(.8);adb('shell','am','start','-n','com.meshnavigator.finni/.MainActivity');time.sleep(1);shot('background-return')
for clip in (13,14):
 play(clip);time.sleep(.2);tap(540,185);time.sleep(.8);shot('skip-'+str(clip))
tap(140,1650);play(9);time.sleep(.15);shot('motion-off-active');time.sleep(1.2);shot('motion-off-idle-a');time.sleep(.7);shot('motion-off-idle-b');tap(140,1650)
adb('shell','settings','put','global','transition_animation_scale','0');time.sleep(.7);play(10);time.sleep(.15);shot('system-reduce-active');time.sleep(1.2);shot('system-reduce-idle-a');time.sleep(.7);shot('system-reduce-idle-b');adb('shell','settings','put','global','transition_animation_scale','1')
rec.wait(timeout=60);adb('pull','/sdcard/finni-regression.mp4',str(R/'lifecycle-api26.mp4'))
R.joinpath('lifecycle-captures.json').write_text(json.dumps(records,indent=2))
R.joinpath('logcat-final.txt').write_bytes(adb('logcat','-d','-v','threadtime','ReactNativeJS:V','AndroidRuntime:E','*:S'))
print('Lifecycle complete',flush=True)
