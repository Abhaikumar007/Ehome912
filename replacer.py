import os

files_to_update = [
    'articles/best-tuition-centres-kollam-2026.html',
    'articles/cbse-tuition-kottiyam.html',
    'articles/class-10-cbse-tuition-kollam.html',
    'articles/how-personalized-tuition-works.html',
    'articles/why-students-struggle-cbse-maths.html'
]

replacements = [
    ('15-student', '25-student'),
    ('15 students', '25 students'),
    ('15 kids', '25 kids'),
    ('15 faces', '25 faces'),
    ('Rule of 15', 'Rule of 25'),
    ('Limit is 15', 'Limit is 25'),
    ('batch of 15', 'batch of 25'),
    ('batches of 15', 'batches of 25'),
    ('room of 15', 'room of 25'),
    ('group of 15', 'group of 25'),
    ('>15<', '>25<'),
    ("content: '15'", "content: '25'"),
    ('Magic 15', 'Magic 25'),
    ('exactly 15', 'exactly 25'),
    ('maximum of 15', 'maximum of 25'),
    ('When 15', 'When 25'),
    ('15 is the exact', '25 is the exact'),
    ('15 is the perfect', '25 is the perfect'),
    ('15 is the absolute', '25 is the absolute'),
    ('15 allows for', '25 allows for')
]

for file_path in files_to_update:
    full_path = os.path.join(r"c:\Users\madhu\code_test", file_path)
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        # Also handle Title cases just in case
        content = content.replace(old.title(), new.title())
        
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Done!')
