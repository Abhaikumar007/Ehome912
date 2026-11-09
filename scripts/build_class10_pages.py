import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "study-materials", "cs10_structured_data.json")
MAP_PATH = os.path.join(BASE_DIR, "study-materials", "gdrive_sslc_files_map.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "study-materials", "cs10")

CSS_TEMPLATE = """
<style>
    :root {
        --primary-blue: #005a87;
        --secondary-blue: #0077cc;
        --card-bg: #ffffff;
        --border-color: #e2e8f0;
        --text-dark: #1e293b;
        --text-muted: #64748b;
        --btn-qp: #0284c7;
        --btn-qp-hover: #0369a1;
        --btn-key: #16a34a;
        --btn-key-hover: #15803d;
        --badge-math: #0284c7;
        --badge-sci: #16a34a;
        --badge-soc: #d97706;
        --badge-lang: #7c3aed;
    }

    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8fafc;
        color: var(--text-dark);
        margin: 0;
        padding-bottom: 50px;
        line-height: 1.5;
    }

    .subject-header {
        background: linear-gradient(135deg, #005a87 0%, #003b59 100%);
        color: white;
        padding: 2.2rem 1rem 1.8rem 1rem;
        text-align: center;
        margin-bottom: 20px;
    }

    .subject-header h1 {
        margin: 0 0 8px 0;
        font-size: 2.2rem;
        font-weight: 700;
    }

    .subject-header p {
        margin: 0;
        font-size: 1.05rem;
        opacity: 0.9;
    }

    .container {
        max-width: 1140px;
        margin: 0 auto;
        padding: 0 15px;
    }

    .breadcrumbs {
        margin: -5px auto 15px auto;
        font-size: 0.9rem;
        color: var(--text-muted);
    }

    .breadcrumbs a {
        color: var(--primary-blue);
        text-decoration: none;
    }

    .breadcrumbs a:hover {
        text-decoration: underline;
    }

    .back-btn-box {
        margin-bottom: 20px;
    }

    .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 14px;
        background-color: #e2e8f0;
        color: #1e293b;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: background 0.2s ease;
    }

    .back-btn:hover {
        background-color: #cbd5e1;
    }

    .section-nav-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 25px;
    }

    .section-nav-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 18px;
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 30px;
        color: var(--text-dark);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.92rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
    }

    .section-nav-pill:hover {
        background: var(--primary-blue);
        color: #ffffff;
        border-color: var(--primary-blue);
    }

    .search-box-wrapper {
        position: relative;
        margin-bottom: 30px;
    }

    .search-input {
        width: 100%;
        padding: 14px 20px 14px 45px;
        font-size: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        box-sizing: border-box;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--secondary-blue);
        box-shadow: 0 0 0 3px rgba(0, 119, 204, 0.15);
    }

    .search-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 1.1rem;
    }

    .exam-section {
        margin-bottom: 45px;
        scroll-margin-top: 20px;
    }

    .section-title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        border-bottom: 2px solid #cbd5e1;
        margin-bottom: 20px;
    }

    .section-title-bar .title-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .section-title-bar h2 {
        font-size: 1.45rem;
        font-weight: 700;
        color: var(--primary-blue);
        margin: 0;
    }

    .section-title-bar .badge-count {
        background: #e2e8f0;
        color: #475569;
        font-size: 0.85rem;
        padding: 3px 10px;
        border-radius: 12px;
        font-weight: 600;
    }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
        gap: 20px;
    }

    .exam-card {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 18px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .exam-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 18px rgba(0,0,0,0.08);
        border-color: #cbd5e1;
    }

    .card-top {
        margin-bottom: 12px;
    }

    .card-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
    }

    .badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .badge-year { background: #e0f2fe; color: #0369a1; }
    .badge-term { background: #ede9fe; color: #6d28d9; }
    .badge-med { background: #fef3c7; color: #b45309; }

    .card-title {
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.35;
        color: var(--text-dark);
        margin: 0;
    }

    .card-subtitle {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-top: 4px;
    }

    .card-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-top: 1px solid #f1f5f9;
        padding-top: 12px;
    }

    .action-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 12px;
        font-size: 0.85rem;
        font-weight: 600;
        border-radius: 6px;
        text-decoration: none;
        transition: background 0.2s, transform 0.1s;
        flex: 1 1 auto;
        text-align: center;
    }

    .btn-qp {
        background-color: var(--btn-qp);
        color: white;
    }

    .btn-qp:hover {
        background-color: var(--btn-qp-hover);
        color: white;
    }

    .btn-key {
        background-color: var(--btn-key);
        color: white;
    }

    .btn-key:hover {
        background-color: var(--btn-key-hover);
        color: white;
    }

    .btn.disabled {
        background-color: #f1f5f9;
        color: #94a3b8;
        pointer-events: none;
    }

    .practice-sets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 12px;
    }

    .practice-set-card {
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 14px;
        text-decoration: none;
        color: var(--text-dark);
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s;
    }

    .practice-set-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        border-color: var(--secondary-blue);
        color: var(--secondary-blue);
    }

    .practice-set-card i {
        font-size: 1.4rem;
        color: #dc2626;
        flex-shrink: 0;
    }

    .practice-set-card .set-label {
        font-size: 0.85rem;
        font-weight: 600;
        line-height: 1.3;
    }

    footer {
        text-align: center;
        padding: 25px 0;
        margin-top: 50px;
        border-top: 1px solid #e2e8f0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    footer a {
        color: var(--primary-blue);
        text-decoration: none;
    }

    @media (max-width: 768px) {
        .cards-grid { grid-template-columns: 1fr; }
        .subject-header h1 { font-size: 1.7rem; }
    }
</style>
"""

JS_FILTER = """
<script>
function filterPapers() {
    const query = document.getElementById('paperSearch').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.exam-card, .practice-set-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    document.querySelectorAll('.exam-section').forEach(sec => {
        const visibleCards = sec.querySelectorAll('.exam-card:not([style*="display: none"]), .practice-set-card:not([style*="display: none"])');
        sec.style.display = visibleCards.length > 0 ? '' : 'none';
    });
}
</script>
"""

def generate_all_class10_pages():
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found.")
        return

    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Load Google Drive map
    gdrive_map = {}
    if os.path.exists(MAP_PATH):
        with open(MAP_PATH, 'r', encoding='utf-8') as f:
            gdrive_map = json.load(f)

    # Normalize lookup maps
    lookup_by_rel = {}
    lookup_by_fn = {}
    for rel_path, link in gdrive_map.items():
        norm_rel = rel_path.replace('\\', '/').strip('/').lower()
        lookup_by_rel[norm_rel] = link
        fn = os.path.basename(rel_path).lower()
        if fn not in lookup_by_fn:
            lookup_by_fn[fn] = link

    def get_link(raw_path):
        if not raw_path:
            return "#"
        norm = raw_path.replace('\\', '/').strip('/').lower()
        if norm in lookup_by_rel:
            return lookup_by_rel[norm]
        fn = os.path.basename(raw_path).lower()
        if fn in lookup_by_fn:
            return lookup_by_fn[fn]
        return "#"

    def render_btn(label, raw_path, btn_class="btn-qp", icon="fa-file-pdf", tooltip=""):
        url = get_link(raw_path)
        title_attr = f'title="{tooltip} - Open in Google Drive"' if tooltip else 'title="Open in Google Drive"'
        if url == "#":
            return f'<a href="#" class="btn {btn_class} disabled" title="Uploading to Google Drive..."><i class="fa-solid {icon}"></i> {label}</a>'
        return f'<a href="{url}" target="_blank" rel="noopener noreferrer" class="btn {btn_class}" {title_attr}><i class="fa-solid {icon}"></i> {label}</a>'

    def render_exam_card(item):
        badges = []
        if item.get('year'):
            badges.append(f'<span class="badge badge-year">{item["year"]}</span>')
        if item.get('term'):
            badges.append(f'<span class="badge badge-term">{item["term"]}</span>')
        if item.get('medium'):
            badges.append(f'<span class="badge badge-med">{item["medium"]}</span>')

        # Action buttons
        btns = []
        qps = item.get('question_papers', [])
        keys = item.get('answer_keys', [])

        for i, qp in enumerate(qps):
            label = "Question Paper"
            title = qp.get('title', '')
            if len(qps) > 1:
                if 'English' in title or '(EM)' in title or 'Eng' in title:
                    label = "QP (Eng Med)"
                elif 'Malayalam' in title or '(MM)' in title or 'Mal' in title:
                    label = "QP (Mal Med)"
                elif 'Set ' in title:
                    match = re.search(r'Set\s+[A-Za-z0-9]+', title, re.IGNORECASE)
                    label = f"QP ({match.group(0)})" if match else f"QP {i+1}"
                else:
                    label = f"QP {i+1}"
            btns.append(render_btn(label, qp.get('local_path', ''), "btn-qp", "fa-file-pdf", tooltip=title))

        for i, key in enumerate(keys):
            label = "Answer Key"
            title = key.get('title', '')
            if len(keys) > 1:
                if 'English' in title or '(EM)' in title or 'Eng' in title:
                    label = "Key (Eng Med)"
                elif 'Malayalam' in title or '(MM)' in title or 'Mal' in title:
                    label = "Key (Mal Med)"
                elif 'by ' in title.lower():
                    match = re.search(r'by\s+([A-Za-z0-9\s]+?)(?:Sir|sir|\.|$)', title)
                    if match:
                        sir_name = match.group(1).strip()
                        label = f"Key ({sir_name[:12]})"
                    else:
                        label = f"Key {i+1}"
                elif 'Set ' in title:
                    match = re.search(r'Set\s+[A-Za-z0-9]+', title, re.IGNORECASE)
                    label = f"Key ({match.group(0)})" if match else f"Key {i+1}"
                else:
                    label = f"Key {i+1}"
            btns.append(render_btn(label, key.get('local_path', ''), "btn-key", "fa-circle-check", tooltip=title))

        action_html = ""
        if btns:
            btns_formatted = "\n                    ".join(btns)
            action_html = f'''<div class="action-group">
                    {btns_formatted}
                </div>'''

        badges_html = "".join(badges)
        return f'''
        <div class="exam-card">
            <div class="card-top">
                <div class="card-badges">{badges_html}</div>
                <h3 class="card-title">{item.get("title", "Exam Paper")}</h3>
            </div>
            <div class="card-actions">
                {action_html}
            </div>
        </div>'''

    def render_practice_card(item):
        url = get_link(item.get('local_path', ''))
        icon_class = "fa-circle-check" if item.get('is_key') else "fa-file-pdf"
        target_attr = 'target="_blank" rel="noopener noreferrer"' if url != '#' else ''
        year_str = f" ({item['year']})" if item.get('year') else ""
        return f'''
            <a href="{url}" {target_attr} class="practice-set-card" title="Open in Google Drive">
                <i class="fa-solid {icon_class}"></i>
                <span class="set-label">{item.get("title", "Study Material")}{year_str}</span>
            </a>'''

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for subj in data.get('subjects', []):
        sub_name = subj['subject_name']
        sub_icon = subj.get('icon', 'fa-book')
        html_fn = subj['html_file']
        res = subj.get('resources', {})

        annual_cards = [render_exam_card(it) for it in res.get('board_annual_exams', [])]
        model_cards = [render_exam_card(it) for it in res.get('model_exams', [])]
        terminal_cards = [render_exam_card(it) for it in res.get('terminal_exams', [])]
        practice_cards = [render_practice_card(it) for it in res.get('practice_revision_pools', [])]

        # Section pills
        pills = []
        if annual_cards:
            pills.append('<a href="#board-exams" class="section-nav-pill"><i class="fa-solid fa-graduation-cap"></i> Board Exams</a>')
        if model_cards:
            pills.append('<a href="#model-exams" class="section-nav-pill"><i class="fa-solid fa-file-signature"></i> Model Exams</a>')
        if terminal_cards:
            pills.append('<a href="#terminal-exams" class="section-nav-pill"><i class="fa-solid fa-calendar-check"></i> Terminal Exams</a>')
        if practice_cards:
            pills.append('<a href="#practice-sets" class="section-nav-pill"><i class="fa-solid fa-layer-group"></i> Practice Sets</a>')

        sections_html = []
        if annual_cards:
            sections_html.append(f'''
            <section id="board-exams" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-graduation-cap fa-lg" style="color: #005a87;"></i>
                        <h2>Board & Annual Examinations</h2>
                    </div>
                    <span class="badge-count">{len(annual_cards)} Exams</span>
                </div>
                <div class="cards-grid">
                    {"".join(annual_cards)}
                </div>
            </section>''')

        if model_cards:
            sections_html.append(f'''
            <section id="model-exams" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-file-signature fa-lg" style="color: #005a87;"></i>
                        <h2>Model Examinations</h2>
                    </div>
                    <span class="badge-count">{len(model_cards)} Exams</span>
                </div>
                <div class="cards-grid">
                    {"".join(model_cards)}
                </div>
            </section>''')

        if terminal_cards:
            sections_html.append(f'''
            <section id="terminal-exams" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-calendar-check fa-lg" style="color: #005a87;"></i>
                        <h2>Terminal Examinations (Onam & Christmas)</h2>
                    </div>
                    <span class="badge-count">{len(terminal_cards)} Exams</span>
                </div>
                <div class="cards-grid">
                    {"".join(terminal_cards)}
                </div>
            </section>''')

        if practice_cards:
            sections_html.append(f'''
            <section id="practice-sets" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-layer-group fa-lg" style="color: #005a87;"></i>
                        <h2>Practice Sets & Question Banks</h2>
                    </div>
                    <span class="badge-count">{len(practice_cards)} Materials</span>
                </div>
                <div class="practice-sets-grid">
                    {"".join(practice_cards)}
                </div>
            </section>''')

        page_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{sub_name} - Class 10 (SSLC) Question Papers & Keys | EduHome</title>
    <meta name="description" content="Download Kerala State Board Class 10 (SSLC) {sub_name} Previous Year Board Question Papers, Model Exams, and Answer Keys on Google Drive.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
    {CSS_TEMPLATE}
</head>
<body>

    <header class="subject-header">
        <h1><i class="fa-solid {sub_icon}"></i> {sub_name}</h1>
        <p>Class 10 (SSLC) Previous Year Question Papers & Official Solutions</p>
    </header>

    <div class="container">
        <nav class="breadcrumbs">
            <a href="../index.html">Home</a> &gt; <a href="../kerala-state.html">Kerala State Board</a> &gt; <a href="kerala-state-class10.html">Class 10 (SSLC)</a> &gt; {sub_name}
        </nav>

        <div class="back-btn-box">
            <a href="kerala-state-class10.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back to Subjects</a>
        </div>

        <nav class="section-nav-pills">
            {"".join(pills)}
        </nav>

        <div class="search-box-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="paperSearch" class="search-input" placeholder="Search by year (e.g. 2024), medium (EM/MM), or exam type..." onkeyup="filterPapers()">
        </div>

        <main>
            {"".join(sections_html)}
        </main>

        <footer>
            <p>© 2026 EduHome | Kerala State Board Class 10 Study Materials Portal | Powered by Google Drive</p>
        </footer>
    </div>

    {JS_FILTER}

</body>
</html>'''

        out_path = os.path.join(OUTPUT_DIR, html_fn)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(page_content)

        print(f"Generated: {html_fn} ({len(annual_cards)} Annual, {len(model_cards)} Model, {len(terminal_cards)} Terminal, {len(practice_cards)} Practice)")

if __name__ == '__main__':
    generate_all_class10_pages()
