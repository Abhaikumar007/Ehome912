import sys

with open('Ehome912/index.html', 'r') as f:
    content = f.read()

old1 = 'src="images/img2.png" alt="Picking Tuition Center"'
new1 = 'src="images/choosing-tuition.jpg" alt="Picking Tuition Center"'

old2 = 'src="images/img1.png" alt="CBSE 2026 Guide"'
new2 = 'src="images/cbse-parent-guide.jpg" alt="CBSE 2026 Guide"'

content = content.replace(old1, new1)
content = content.replace(old2, new2)

with open('Ehome912/index.html', 'w') as f:
    f.write(content)
