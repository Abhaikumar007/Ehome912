import json
import os
import re

json_path = 'c:\\Users\\madhu\\code_test\\scraped_sslc.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Sort alphabetically
data.sort(key=lambda x: x['thread_title'])

# Define categories based on thread titles
categories = {
    'maths': {'title': 'Mathematics', 'icon': 'fa-calculator', 'threads': []},
    'physics': {'title': 'Physics', 'icon': 'fa-magnet', 'threads': []},
    'chemistry': {'title': 'Chemistry', 'icon': 'fa-flask', 'threads': []},
    'biology': {'title': 'Biology', 'icon': 'fa-dna', 'threads': []},
    'social': {'title': 'Social Science', 'icon': 'fa-globe', 'threads': []},
    'english': {'title': 'English', 'icon': 'fa-book-open', 'threads': []},
    'malayalam1': {'title': 'Malayalam I', 'icon': 'fa-feather-pointed', 'threads': []},
    'malayalam2': {'title': 'Malayalam II', 'icon': 'fa-scroll', 'threads': []},
    'hindi': {'title': 'Hindi', 'icon': 'fa-language', 'threads': []},
    'arabic': {'title': 'Arabic', 'icon': 'fa-moon', 'threads': []},
    'general': {'title': 'All Subjects (Model & Revision Pools)', 'icon': 'fa-folder-open', 'threads': []}
}

for item in data:
    title_lower = item['thread_title'].lower()
    if 'math' in title_lower:
        categories['maths']['threads'].append(item)
    elif 'physics' in title_lower:
        categories['physics']['threads'].append(item)
    elif 'chemistry' in title_lower:
        categories['chemistry']['threads'].append(item)
    elif 'biology' in title_lower:
        categories['biology']['threads'].append(item)
    elif 'social' in title_lower:
        categories['social']['threads'].append(item)
    elif 'english' in title_lower:
        categories['english']['threads'].append(item)
    elif 'malayalam i ' in title_lower or 'malayalam i' in title_lower:
        categories['malayalam1']['threads'].append(item)
    elif 'malayalam ii' in title_lower:
        categories['malayalam2']['threads'].append(item)
    elif 'hindi' in title_lower:
        categories['hindi']['threads'].append(item)
    elif 'arabic' in title_lower:
        categories['arabic']['threads'].append(item)
    else:
        categories['general']['threads'].append(item)

# Ensure the directory exists
os.makedirs('c:\\Users\\madhu\\code_test\\study-materials\\cs10', exist_ok=True)

# 1. Generate the Main Subject Grid Page
main_html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kerala State Board - Class 10 Papers</title>
    <meta name="description" content="Find Kerala State Board Class 10 SSLC Annual Exam Question Papers and Answer Keys by subject.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css"> <!-- Same CSS file -->
</head>
<body>

    <header>
        <h1>Kerala State Board - Class 10 (SSLC)</h1>
        <p>Select a Subject</p>
    </header>

     <nav class="breadcrumbs">
         <a href="../index.html">Home</a> > <a href="../kerala-state.html">Kerala State Board</a> > Class 10
     </nav>
     <div class="back-link-container">
         <a href="../kerala-state.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Class Section</a>
     </div>
    <main>
        <section class="search-section">
            <input type="text" id="searchBar" placeholder="Search for a Class 10 subject...">
        </section>

        <section class="subject-grid-container">
            <h2>3. Select a Subject:</h2>
            <div class="subject-grid" id="subjectGrid">
'''

for key, cat in categories.items():
    if len(cat['threads']) > 0:
        main_html += f'''                <a href="kerala-state-class10-{key}.html" class="subject-card {key}" data-subject="{cat['title'].lower()}">
                    <i class="fa-solid {cat['icon']} fa-3x"></i>
                    <span class="subject-name">{cat['title']}</span>
                </a>
'''

main_html += '''            </div>
        </section>
    </main>

    <footer>
        <p>© 2024 EduHome | <a href="#">Disclaimer</a> | <a href="#">About</a></p>
    </footer>

    <script src="../script.js"></script>

</body>
</html>
'''

with open('c:\\Users\\madhu\\code_test\\study-materials\\cs10\\kerala-state-class10.html', 'w', encoding='utf-8') as f:
    f.write(main_html)

# 2. Generate Sub-pages for each category
for key, cat in categories.items():
    if len(cat['threads']) == 0:
        continue
    
    sub_title = cat['title']
    sub_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Class 10 - {sub_title} Papers</title>
    <meta name="description" content="Kerala State Board Class 10 {sub_title} Question Papers and Keys.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css"> <!-- Same CSS file -->
    <style>
        .thread-container {{ margin: 20px auto; max-width: 800px; text-align: left; padding: 0 15px; }}
        .year-section {{ margin-top: 30px; margin-bottom: 20px; }}
        .year-header {{ font-size: 1.5em; color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px; margin-bottom: 15px; }}
        .pdf-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }}
        .attachment-card {{ background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; display: flex; align-items: flex-start; gap: 15px; transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: #333; }}
        .attachment-card:hover {{ transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        .attachment-card i {{ color: #dc3545; font-size: 2em; margin-top: 5px; }}
        .attachment-info {{ display: flex; flex-direction: column; }}
        .attachment-title {{ font-weight: bold; font-size: 0.95em; margin-bottom: 5px; line-height: 1.3; }}
        .attachment-source {{ font-size: 0.8em; color: #666; }}
    </style>
</head>
<body>

    <header>
        <h1>{sub_title} - Class 10</h1>
        <p>Question Papers and Answer Keys</p>
    </header>

     <nav class="breadcrumbs">
         <a href="../index.html">Home</a> &gt; <a href="../kerala-state.html">Kerala State Board</a> &gt; <a href="kerala-state-class10.html">Class 10</a> &gt; {sub_title}
     </nav>
     <div class="back-link-container">
         <a href="kerala-state-class10.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Subjects</a>
     </div>
    <main>
        <section class="thread-container">
            <h2>Available Papers:</h2>
'''
    
    # Process threads to group by year
    years_data = {}
    for item in cat['threads']:
        title = item['thread_title']
        # Look for a 4 digit year between 2010 and 2025 in title
        title_match = re.search(r'\b(201[0-9]|202[0-5])\b', title)
        
        for att in item['attachments']:
            att_name = att['name']
            # Look for year in attachment name if not in title
            att_match = re.search(r'\b(201[0-9]|202[0-5])\b', att_name)
            
            year = "Other / General Papers"
            if title_match:
                year = title_match.group(1)
            elif att_match:
                year = att_match.group(1)
                
            if year not in years_data:
                years_data[year] = []
                
            years_data[year].append({
                'name': att_name,
                'url': att['url'],
                'source': title
            })
            
    # Sort years descending (put "Other" at the end)
    sorted_years = sorted(years_data.keys(), key=lambda x: (x != "Other / General Papers", x), reverse=True)
    
    for year in sorted_years:
        year_display = f"{year} Papers" if year != "Other / General Papers" else year
        sub_html += f'            <div class="year-section">\n'
        sub_html += f'                <h3 class="year-header">{year_display}</h3>\n'
        sub_html += f'                <div class="pdf-grid">\n'
        
        for att in years_data[year]:
            name = att['name'].replace('<', '&lt;').replace('>', '&gt;')
            source = att['source'].replace('<', '&lt;').replace('>', '&gt;')
            url = att['url']
            sub_html += f'                    <a href="{url}" class="attachment-card" target="_blank">\n'
            sub_html += f'                        <i class="fa-solid fa-file-pdf"></i>\n'
            sub_html += f'                        <div class="attachment-info">\n'
            sub_html += f'                            <span class="attachment-title">{name}</span>\n'
            sub_html += f'                            <span class="attachment-source">{source}</span>\n'
            sub_html += f'                        </div>\n'
            sub_html += f'                    </a>\n'
            
        sub_html += f'                </div>\n'
        sub_html += f'            </div>\n'

    sub_html += '''
        </section>
    </main>

    <footer>
        <p>© 2024 EduHome | <a href="#">Disclaimer</a> | <a href="#">About</a></p>
    </footer>
</body>
</html>
'''
    with open(f'c:\\Users\\madhu\\code_test\\study-materials\\cs10\\kerala-state-class10-{key}.html', 'w', encoding='utf-8') as f:
        f.write(sub_html)

print("Generated structured Class 10 pages successfully.")
