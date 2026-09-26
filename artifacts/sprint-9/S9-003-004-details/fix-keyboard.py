from pathlib import Path
p=Path('artifacts/sprint-9/S9-003-004-details/native.py');s=p.read_text(encoding='utf-8')
s=s.replace("q.adb('shell','input','text',str(value));q.adb('shell','input','keyevent','4');time.sleep(.3)","q.adb('shell','input','text',str(value));time.sleep(.6)\n if b'mInputShown=true' in q.adb('shell','dumpsys','input_method'):q.adb('shell','input','keyevent','4')\n time.sleep(.3)")
p.write_text(s,encoding='utf-8')

