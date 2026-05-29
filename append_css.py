import sys

css_path = r'c:\Users\HP\Desktop\PFE\isimm-platform\frontend\src\app\components\candidat\dashboard-candidat\dashboard-candidat.css'
new_css_path = r'c:\Users\HP\Desktop\PFE\cc_new.css'

with open(new_css_path, 'r', encoding='utf-8') as f:
    new_css = f.read()

with open(css_path, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

print('Done appending CSS')
