from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
r=Path(__file__).resolve().parent/'review'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
def sheet(file,items,cols,width=286,height=650):
 rows=(len(items)+cols-1)//cols;im=Image.new('RGB',(cols*width,rows*height),'#E8DFD0');draw=ImageDraw.Draw(im)
 for i,(name,label) in enumerate(items):
  src=Image.open(r/(name+'.png')).convert('RGB');src.thumbnail((width-18,height-52),Image.Resampling.LANCZOS)
  x=(i%cols)*width+9;y=(i//cols)*height+39
  draw.text((x,y-28),label,fill='#3D352D',font=font);im.paste(src,(x,y))
 im.save(r/file,quality=92)
sheet('remaining-screens.jpg',[( 'final-delivery-catalog','Каталог занятий'),('final-delivery-pet','Имя и внешность'),('final-delivery-history','Прогресс'),('final-delivery-help','Короткий словарь'),('final-delivery-adult','Взрослый раздел'),('adult-hold-unlocked','Сводка взрослому'),('result-root','Итог дня'),('onboarding-412','Первое знакомство')],4)
sheet('root-regression.jpg',[(f'final-root-{x}',label) for x,label in [('home','Домик'),('plan','План'),('shop','Покупки'),('savings','Копилка'),('more','Ещё')]],5,260,620)
sheet('lesson-mechanics.jpg',[(x+'-selected' if x in ['LS-B03','LS-P03'] else x+'-solution',label) for x,label in [('LS-B01','B01 · первый бюджет'),('LS-B02','B02 · новый план'),('LS-B03','B03 · мастерская'),('LS-P01','P01 · корзина'),('LS-P02','P02 · наборы'),('LS-P03','P03 · чек'),('LS-S01','S01 · три дня'),('LS-S02','S02 · выбор покупки')]],4)
sheet('accessibility-200.jpg',[('pet-360-200-end','Редактор · 200%'),('LS-P01-360-2-control','Корзина · 200%'),('LS-P03-360-2-control','Чек · 200%'),('adult-controls-200-end','Взрослому · 200%'),('catalog-storage-error-200','Ошибка каталога · 200%'),('system-bars-error-200-actions','Recovery · 200%')],3)
sheet('fallback-and-loading.jpg',[('fallback-missing','Нет файла · QA'),('fallback-corrupt-200','Ошибка PNG · QA 200%'),('loading-qa-1','Loading · QA 100%'),('loading-qa-2','Loading · QA 200%')],4)
print('Contact sheets created from native captures only')
