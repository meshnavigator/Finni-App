
from pathlib import Path
from PIL import Image, ImageDraw
import json
root=Path('artifacts/sprint-9/S9-001-structure')
root.mkdir(parents=True,exist_ok=True)
icons=Path('assets/ui/home-v2');icons.mkdir(parents=True,exist_ok=True)
ink='#725741';s=4
for name in ('home','plan','shop','savings','menu','book','food','care','mood','arrow'):
    im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
    def line(points,w=1.8):d.line([(round(x*s),round(y*s)) for x,y in points],fill=ink,width=round(w*s),joint='curve')
    def ellipse(box,w=1.8,fill=None):d.ellipse(tuple(round(v*s) for v in box),outline=ink,width=round(w*s),fill=fill)
    def rect(box,r=2):d.rounded_rectangle(tuple(round(v*s) for v in box),round(r*s),outline=ink,width=7)
    if name=='home':
        line([(3,11),(12,3),(21,11)]);line([(5,10),(5,21),(10,21),(10,15),(14,15),(14,21),(19,21),(19,10)])
    if name=='plan':
        rect((5,4,19,22));rect((8,2,16,6),1);line([(8,11),(10,13),(15,9)]);line([(9,17),(15,17)])
    if name=='shop':
        line([(5,8),(3,20),(21,20),(19,8),(5,8)]);line([(8,8),(8,6)]);d.arc((8*s,2*s,16*s,10*s),180,360,fill=ink,width=7);line([(16,6),(16,8)])
    if name=='savings':
        rect((3,7,21,21),4);line([(9,10),(15,10)]);ellipse((8,2,16,10));line([(5,20),(5,22)]);line([(19,20),(19,22)])
    if name=='menu':
        for y in (6,12,18):line([(4,y),(20,y)])
    if name=='book':
        line([(12,6),(8,4),(2,4),(2,19),(8,19),(12,21),(16,19),(22,19),(22,4),(16,4),(12,6),(12,21)])
    if name=='food':
        line([(3,12),(21,12)]);d.arc((3*s,5*s,21*s,23*s),0,180,fill=ink,width=7);line([(7,21),(17,21)]);line([(8,7),(9,5),(8,3)]);line([(14,7),(15,5),(14,3)])
    if name=='care':
        line([(12,21),(3,12),(2,8),(3,5),(6,3),(9,4),(12,7),(15,4),(18,3),(21,5),(22,8),(21,12),(12,21)])
    if name=='mood':
        ellipse((2,2,22,22));ellipse((7,8,8,9),1,ink);ellipse((16,8,17,9),1,ink);d.arc((7*s,9*s,17*s,18*s),0,180,fill=ink,width=7)
    if name=='arrow':line([(9,5),(16,12),(9,19)])
    im.save(icons/(name+'.png'))
(icons/'README.md').write_text('Home icons v2: original repo-native line drawings. One 24-unit grid, 1.8-unit stroke, ink #725741, 4x PNG. Reproducible source: artifacts/sprint-9/S9-001-structure/build-icons.py. No external or generated-art source.\n',encoding='utf-8')

