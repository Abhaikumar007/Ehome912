import json
import os
import re

def generate_class_pages(json_path, output_dir, class_name, class_title, breadcrumb_parent):
    # E.g. class_name='cs11', class_title='Class 11 (Plus One)', breadcrumb_parent='<a href="../kerala-state.html">Kerala State Board</a>'
    print(f"Generating pages for {class_title} from {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Sort alphabetically by thread title just to have some base stability
    data.sort(key=lambda x: x['thread_title'])

    # Define categories based on thread titles and attachment names
    categories = {
        'maths': {'title': 'Mathematics', 'icon': 'fa-calculator', 'items': []},
        'physics': {'title': 'Physics', 'icon': 'fa-magnet', 'items': []},
        'chemistry': {'title': 'Chemistry', 'icon': 'fa-flask', 'items': []},
        'biology': {'title': 'Biology', 'icon': 'fa-dna', 'items': []},
        'computer': {'title': 'Computer Science / App', 'icon': 'fa-laptop-code', 'items': []},
        'commerce': {'title': 'Commerce (Accountancy/Business)', 'icon': 'fa-chart-line', 'items': []},
        'humanities': {'title': 'Humanities (History/Geog/Econ)', 'icon': 'fa-landmark', 'items': []},
        'social': {'title': 'Social Science', 'icon': 'fa-globe', 'items': []},
        'english': {'title': 'English', 'icon': 'fa-book-open', 'items': []},
        'malayalam1': {'title': 'Malayalam I', 'icon': 'fa-feather-pointed', 'items': []},
        'malayalam2': {'title': 'Malayalam II', 'icon': 'fa-scroll', 'items': []},
        'hindi': {'title': 'Hindi', 'icon': 'fa-language', 'items': []},
        'arabic': {'title': 'Arabic', 'icon': 'fa-moon', 'items': []},
        'general': {'title': 'All Subjects (Model & Revision Pools)', 'icon': 'fa-folder-open', 'items': []}
    }

    for thread in data:
        thread_title = thread['thread_title']
        title_lower = thread_title.lower()
        
        # Determine a default category for this thread
        default_cat = 'general'
        if 'math' in title_lower: default_cat = 'maths'
        elif 'physics' in title_lower: default_cat = 'physics'
        elif 'chemistry' in title_lower: default_cat = 'chemistry'
        elif 'biology' in title_lower or 'botany' in title_lower or 'zoology' in title_lower: default_cat = 'biology'
        elif 'computer' in title_lower: default_cat = 'computer'
        elif 'accountancy' in title_lower or 'business' in title_lower or 'commerce' in title_lower: default_cat = 'commerce'
        elif 'history' in title_lower or 'geography' in title_lower or 'economics' in title_lower or 'sociology' in title_lower or 'journalism' in title_lower: default_cat = 'humanities'
        elif 'social' in title_lower: default_cat = 'social'
        elif 'english' in title_lower: default_cat = 'english'
        elif 'malayalam i ' in title_lower or 'malayalam i' in title_lower or 'malayalam 1' in title_lower: default_cat = 'malayalam1'
        elif 'malayalam ii' in title_lower or 'malayalam 2' in title_lower: default_cat = 'malayalam2'
        elif 'malayalam' in title_lower: default_cat = 'malayalam1'
        elif 'hindi' in title_lower: default_cat = 'hindi'
        elif 'arabic' in title_lower: default_cat = 'arabic'

        title_match = re.search(r'\b(201[0-9]|202[0-9])\b', thread_title)
        
        for att in thread['attachments']:
            att_name = att['name']
            att_lower = att_name.lower()
            
            cat = default_cat
            # If the overall thread is "general", attempt to classify the specific attachment
            if default_cat == 'general':
                if 'math' in att_lower: cat = 'maths'
                elif 'physics' in att_lower: cat = 'physics'
                elif 'chemistry' in att_lower: cat = 'chemistry'
                elif 'biology' in att_lower or 'botany' in att_lower or 'zoology' in att_lower: cat = 'biology'
                elif 'computer' in att_lower: cat = 'computer'
                elif 'accountancy' in att_lower or 'business' in att_lower or 'commerce' in att_lower: cat = 'commerce'
                elif 'history' in att_lower or 'geography' in att_lower or 'economics' in att_lower or 'sociology' in att_lower or 'journalism' in att_lower: cat = 'humanities'
                elif 'social' in att_lower: cat = 'social'
                elif 'english' in att_lower: cat = 'english'
                elif 'malayalam i ' in att_lower or 'malayalam i' in att_lower or 'malayalam 1' in att_lower: cat = 'malayalam1'
                elif 'malayalam ii' in att_lower or 'malayalam 2' in att_lower: cat = 'malayalam2'
                elif 'malayalam' in att_lower: cat = 'malayalam1'
                elif 'hindi' in att_lower: cat = 'hindi'
                elif 'arabic' in att_lower: cat = 'arabic'
            
            att_match = re.search(r'\b(201[0-9]|202[0-9])\b', att_name)
            year = "Other / General Papers"
            
            # Use title year as default; override if attachment has a year directly in its name
            if title_match:
                year = title_match.group(1)
            if att_match:
                year = att_match.group(1)
                
            categories[cat]['items'].append({
                'name': att_name,
                'url': att['url'],
                'source': thread_title,
                'year': year
            })

    # Ensure the directory exists
    os.makedirs(output_dir, exist_ok=True)

    # 1. Generate the Main Subject Grid Page
    main_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kerala State Board - {class_title} Papers</title>
    <meta name="description" content="Find Kerala State Board {class_title} Annual Exam Question Papers and Answer Keys by subject.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css"> <!-- Same CSS file -->
</head>
<body>

    <header>
        <h1>Kerala State Board - {class_title}</h1>
        <p>Select a Subject</p>
    </header>

     <nav class="breadcrumbs">
         <a href="../index.html">Home</a> &gt; {breadcrumb_parent} &gt; {class_title}
     </nav>
     <div class="back-link-container">
         <a href="../kerala-state.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Class Section</a>
     </div>
    <main>
        <section class="search-section">
            <input type="text" id="searchBar" placeholder="Search for a {class_title} subject...">
        </section>

        <section class="subject-grid-container">
            <h2>3. Select a Subject:</h2>
            <div class="subject-grid" id="subjectGrid">
'''

    for key, cat in categories.items():
        if len(cat['items']) > 0:
            main_html += f'''                <a href="kerala-state-{class_name}-{key}.html" class="subject-card {key}" data-subject="{cat['title'].lower()}">
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

    main_file = os.path.join(output_dir, f'kerala-state-{class_name}.html')
    with open(main_file, 'w', encoding='utf-8') as f:
        f.write(main_html)

    # 2. Generate Sub-pages for each category
    for key, cat in categories.items():
        if len(cat['items']) == 0:
            continue
        
        sub_title = cat['title']
        sub_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{class_title} - {sub_title} Papers</title>
    <meta name="description" content="Kerala State Board {class_title} {sub_title} Question Papers and Keys.">
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
        <h1>{sub_title} - {class_title}</h1>
        <p>Question Papers and Answer Keys</p>
    </header>

     <nav class="breadcrumbs">
         <a href="../index.html">Home</a> &gt; {breadcrumb_parent} &gt; <a href="kerala-state-{class_name}.html">{class_title}</a> &gt; {sub_title}
     </nav>
     <div class="back-link-container">
         <a href="kerala-state-{class_name}.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Subjects</a>
     </div>
    <main>
        <section class="thread-container">
            <h2>Available Papers:</h2>
'''
        
        # Process items to group by year
        years_data = {}
        for item in cat['items']:
            year = item['year']
            if year not in years_data:
                years_data[year] = []
                
            years_data[year].append(item)
                
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
        sub_file = os.path.join(output_dir, f'kerala-state-{class_name}-{key}.html')
        with open(sub_file, 'w', encoding='utf-8') as f:
            f.write(sub_html)

if __name__ == '__main__':
    # Class 10
    generate_class_pages(
        json_path='c:\\Users\\madhu\\code_test\\scraped_sslc.json',
        output_dir='c:\\Users\\madhu\\code_test\\study-materials\\cs10',
        class_name='class10',
        class_title='Class 10 (SSLC)',
        breadcrumb_parent='<a href="../kerala-state.html">Kerala State Board</a>'
    )
    
    # Class 11
    generate_class_pages(
        json_path='c:\\Users\\madhu\\code_test\\scraped_class11.json',
        output_dir='c:\\Users\\madhu\\code_test\\study-materials\\cs11',
        class_name='class11',
        class_title='Class 11 (Plus One)',
        breadcrumb_parent='<a href="../kerala-state.html">Kerala State Board</a>'
    )
    
    # Class 12
    generate_class_pages(
        json_path='c:\\Users\\madhu\\code_test\\scraped_class12.json',
        output_dir='c:\\Users\\madhu\\code_test\\study-materials\\cs12',
        class_name='class12',
        class_title='Class 12 (Plus Two)',
        breadcrumb_parent='<a href="../kerala-state.html">Kerala State Board</a>'
    )
