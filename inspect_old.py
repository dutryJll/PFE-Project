import codecs
path=r'c:\Users\HP\Desktop\PFE\isimm-platform\frontend\src\app\components\masters\masters.ts'
with codecs.open(path,'r','utf-8') as f:
    for i,line in enumerate(f,1):
        if 80<=i<=95:
            print(i, line.encode('unicode_escape'))
