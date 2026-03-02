path=r'c:\Users\HP\Desktop\PFE\isimm-platform\frontend\src\app\components\masters\masters.html'
with open(path,encoding='utf-8') as f:
    for i,line in enumerate(f,1):
        if 110<=i<=120:
            print(f"{i:4} {line.rstrip()}")
