from pathlib import Path
import json
def rgb(h):return [int(h[i:i+2],16)/255 for i in (1,3,5)]
def lum(c):
    c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
    return sum(a*b for a,b in zip(c,[.2126,.7152,.0722]))
def contrast(a,b):return (max(lum(a),lum(b))+.05)/(min(lum(a),lum(b))+.05)
surface=rgb('#fff8eb')
worst=[v*.78 for v in surface]
result={'method':'sRGB source-over compositing of 78% warm material on black (conservative darkest backdrop); opaque foreground. Text AA threshold 4.5:1, icon 3:1. This is not a TalkBack test.','material':'rgba(255,248,235,.78)','worstBackdropRGB':[round(v*255) for v in worst],
'contrast':{'primaryInk':contrast(rgb('#302d2a'),worst),'secondaryInk':contrast(rgb('#514537'),worst),'lineIcons':contrast(rgb('#79563c'),worst),'primaryAction':contrast(rgb('#ffffff'),rgb('#ae482a')),'disabledAction':contrast(rgb('#ffffff'),rgb('#84705d'))}}
assert result['contrast']['primaryInk']>=4.5 and result['contrast']['secondaryInk']>=4.5 and result['contrast']['lineIcons']>=3
Path('artifacts/sprint-9/S9-001-polish/contrast.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))

