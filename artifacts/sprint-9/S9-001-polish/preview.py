from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
out=root/'review';out.mkdir(exist_ok=True)
for name,w,h in [('ordinary',390,844),('small',360,640),('large',360,640),('large-stress',360,640)]:
    im=Image.open(root/'android'/f'{name}.png')
    scale=min(im.width/w,im.height/h)
    x=(im.width-w*scale)/2;y=(im.height-h*scale)/2
    im.crop((round(x),round(y),round(x+w*scale),round(y+h*scale))).resize((w,h),Image.Resampling.LANCZOS).save(out/f'{name}.png')