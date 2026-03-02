path=r'c:\Users\HP\Desktop\PFE\isimm-platform\frontend\src\app\components\masters\masters.ts'
with open(path,encoding='utf-8') as f:
    for i,line in enumerate(f,1):
        if i<=100 or i>200:
            print(i,repr(line))
