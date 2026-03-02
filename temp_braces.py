path=r'c:\Users\HP\Desktop\PFE\isimm-platform\frontend\src\app\components\masters\masters.html'
open_file=open(path,encoding='utf-8')
counter=0
for i,line in enumerate(open_file,1):
    for ch in line:
        if ch=='{': counter+=1
        elif ch=='}': counter-=1
    if '{' in line or '}' in line:
        print(i, repr(line.rstrip()), 'balance', counter)
print('final balance', counter)
