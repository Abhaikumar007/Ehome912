import html
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "study-materials", "cbse_class10_pyq_data.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "study-materials", "cbse10")

SUBJECT_CONFIG = {
    "maths_standard": {
        "name": "Mathematics Standard",
        "icon": "fa-calculator",
        "css_class": "maths",
        "file": "cbse-class10-maths-standard.html",
    },
    "maths_basic": {
        "name": "Mathematics Basic",
        "icon": "fa-square-root-variable",
        "css_class": "maths",
        "file": "cbse-class10-maths-basic.html",
    },
    "science": {
        "name": "Science",
        "icon": "fa-flask",
        "css_class": "science",
        "file": "cbse-class10-science.html",
    },
    "social_science": {
        "name": "Social Science",
        "icon": "fa-globe",
        "css_class": "social",
        "file": "cbse-class10-social-science.html",
    },
    "english_language_literature": {
        "name": "English Language & Literature",
        "icon": "fa-book-open",
        "css_class": "english",
        "file": "cbse-class10-english-ll.html",
    },
    "english_communicative": {
        "name": "English Communicative",
        "icon": "fa-comments",
        "css_class": "english",
        "file": "cbse-class10-english-comm.html",
    },
    "hindi_a": {
        "name": "Hindi Course A",
        "icon": "fa-language",
        "css_class": "hindi",
        "file": "cbse-class10-hindi-a.html",
    },
    "hindi_b": {
        "name": "Hindi Course B",
        "icon": "fa-pen-nib",
        "css_class": "hindi",
        "file": "cbse-class10-hindi-b.html",
    },
    "sanskrit": {
        "name": "Sanskrit",
        "icon": "fa-om",
        "css_class": "sanskrit",
        "file": "cbse-class10-sanskrit.html",
    },
    "information_technology": {
        "name": "Information Technology",
        "icon": "fa-laptop-code",
        "css_class": "computer",
        "file": "cbse-class10-it.html",
    },
    "computer_applications": {
        "name": "Computer Applications",
        "icon": "fa-code",
        "css_class": "computer",
        "file": "cbse-class10-computer-app.html",
    },
}

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
        --btn-folder: #7c3aed;
        --btn-folder-hover: #6d28d9;
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }

    html {
        scroll-behavior: smooth;
        overflow-x: hidden;
    }

    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8fafc;
        color: var(--text-dark);
        margin: 0;
        padding-bottom: 60px;
        line-height: 1.5;
        overflow-x: hidden;
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
        gap: 8px;
        margin-bottom: 22px;
    }

    .section-nav-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 15px;
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 30px;
        color: var(--text-dark);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.88rem;
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

    .subsection-heading {
        font-size: 1.05rem;
        font-weight: 600;
        color: #334155;
        margin: 22px 0 12px 0;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
        gap: 18px;
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
        font-size: 0.74rem;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }

    .badge-year { background: #e0f2fe; color: #0369a1; }
    .badge-code { background: #f1f5f9; color: #334155; }
    .badge-set { background: #dcfce7; color: #15803d; }
    .badge-region { background: #fef3c7; color: #b45309; }
    .badge-supp { background: #fae8ff; color: #86198f; }

    .card-title {
        font-size: 1.02rem;
        font-weight: 600;
        line-height: 1.35;
        color: var(--text-dark);
        margin: 0;
        word-break: break-word;
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

    .btn-folder {
        background-color: var(--btn-folder);
        color: white;
    }

    .btn-folder:hover {
        background-color: var(--btn-folder-hover);
        color: white;
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

    .back-top-btn {
        position: fixed;
        right: 16px;
        bottom: 20px;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: var(--primary-blue);
        color: #ffffff;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        cursor: pointer;
        z-index: 999;
        transition: transform 0.2s, background 0.2s;
    }

    .back-top-btn:hover {
        background: #003b59;
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        .subject-header { padding: 1.5rem 1rem 1.3rem 1rem; margin-bottom: 14px; }
        .subject-header h1 { font-size: 1.55rem; line-height: 1.25; }
        .subject-header p { font-size: 0.95rem; }
        .container { padding: 0 12px; }
        .breadcrumbs { font-size: 0.84rem; line-height: 1.6; margin-bottom: 12px; }
        .back-btn { min-height: 44px; padding: 10px 16px; font-size: 0.92rem; }
        .section-nav-pills {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 8px;
            margin-bottom: 16px;
            scrollbar-width: none;
        }
        .section-nav-pills::-webkit-scrollbar { display: none; }
        .section-nav-pill {
            flex: 0 0 auto;
            min-height: 40px;
            padding: 8px 16px;
            font-size: 0.9rem;
        }
        .search-box-wrapper { margin-bottom: 20px; }
        .search-input { min-height: 46px; font-size: 16px; }
        .section-title-bar { flex-wrap: wrap; gap: 8px; }
        .section-title-bar h2 { font-size: 1.25rem; }
        .cards-grid { grid-template-columns: 1fr; gap: 14px; }
        .exam-card { padding: 15px; }
        .btn { min-height: 44px; padding: 10px 12px; font-size: 0.88rem; }
    }

    @media (max-width: 480px) {
        .action-group { flex-direction: column; }
        .btn { width: 100%; }
    }
</style>
"""

JS_FILTER = """
<button id="backToTopBtn" class="back-top-btn" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" aria-label="Back to top" title="Back to top">
    <i class="fa-solid fa-arrow-up"></i>
</button>
<script>
window.addEventListener('scroll', function() {
    const btn = document.getElementById('backToTopBtn');
    if (btn) {
        btn.style.display = window.scrollY > 350 ? 'flex' : 'none';
    }
});

function filterPapers() {
    const query = document.getElementById('paperSearch').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.exam-card');

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
    });

    document.querySelectorAll('.subsection-group').forEach(sub => {
        const visible = sub.querySelectorAll('.exam-card:not([style*="display: none"])');
        sub.style.display = visible.length > 0 ? '' : 'none';
    });

    document.querySelectorAll('.exam-section').forEach(sec => {
        const visibleCards = sec.querySelectorAll('.exam-card:not([style*="display: none"])');
        sec.style.display = visibleCards.length > 0 ? '' : 'none';
    });
}
</script>
"""


def esc(val):
    return html.escape(str(val)) if val is not None else ""


def render_paper_card(paper, year, is_folder=False, is_supplementary=False):
    badges = [f'<span class="badge badge-year">{esc(year)}</span>']
    if is_supplementary:
        badges.append('<span class="badge badge-supp">Compartment / Supp</span>')
    if paper.get("code"):
        badges.append(f'<span class="badge badge-code">Code: {esc(paper["code"])}</span>')
    if paper.get("set"):
        set_lbl = paper["set"]
        if paper.get("subset"):
            set_lbl += f' / {paper["subset"]}'
        badges.append(f'<span class="badge badge-set">{esc(set_lbl)}</span>')
    if paper.get("region_or_type"):
        badges.append(f'<span class="badge badge-region">{esc(paper["region_or_type"])}</span>')

    buttons = []
    qp_url = paper.get("question_paper_url")
    if qp_url:
        if is_folder:
            buttons.append(
                f'<a href="{esc(qp_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-folder" title="Open Google Drive Folder">'
                f'<i class="fa-solid fa-folder-open"></i> Open Drive Folder</a>'
            )
        else:
            buttons.append(
                f'<a href="{esc(qp_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-qp" title="Open Question Paper on Google Drive">'
                f'<i class="fa-solid fa-file-pdf"></i> Question Paper</a>'
            )

    seen_sol_urls = set()
    for sol in paper.get("solutions", []):
        s_url = sol.get("url")
        if not s_url or s_url == qp_url or s_url in seen_sol_urls:
            continue
        seen_sol_urls.add(s_url)
        s_label = sol.get("label") or "Solution"
        buttons.append(
            f'<a href="{esc(s_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-key" title="Open {esc(s_label)} on Google Drive">'
            f'<i class="fa-solid fa-circle-check"></i> {esc(s_label)}</a>'
        )

    btns_formatted = "\n                    ".join(buttons)
    actions_html = f'''<div class="action-group">
                    {btns_formatted}
                </div>''' if buttons else ""

    return f'''
        <div class="exam-card">
            <div class="card-top">
                <div class="card-badges">{"".join(badges)}</div>
                <h3 class="card-title">{esc(paper.get("title", "Question Paper"))}</h3>
            </div>
            <div class="card-actions">
                {actions_html}
            </div>
        </div>'''


def generate_subject_index(subject_summaries):
    cards_html = []
    for subj_key, cfg in SUBJECT_CONFIG.items():
        stats = subject_summaries.get(subj_key, {"years": [], "papers": 0})
        years = sorted(stats["years"])
        yr_range = f"{years[0]}–{years[-1]}" if len(years) > 1 else (years[0] if years else "")
        detail = f'{stats["papers"]} Papers ({yr_range})' if yr_range else f'{stats["papers"]} Papers'
        cards_html.append(f'''                <a href="{cfg["file"]}" class="subject-card {cfg["css_class"]}" data-subject="{esc(cfg["name"].lower())}">
                    <i class="fa-solid {cfg["icon"]} fa-3x"></i>
                    <span class="subject-name">{esc(cfg["name"])}</span>
                    <span class="subject-detail">{esc(detail)}</span>
                </a>''')

    index_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CBSE Board - Class 10 Previous Year Question Papers | EduHome</title>
    <meta name="description" content="Download CBSE Class 10 Previous Year Board Question Papers (2013–2026) and Official Marking Scheme Solutions by subject.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
</head>
<body>

    <header>
        <h1>CBSE Board - Class 10</h1>
        <p>Previous Year Question Papers & Official Marking Schemes (2013–2026)</p>
    </header>

    <nav class="breadcrumbs">
        <a href="../index.html">Home</a> &gt; <a href="../cbse.html">CBSE Board</a> &gt; Class 10
    </nav>
    <div class="back-link-container">
        <a href="../cbse.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Class Section</a>
    </div>
    <main>
        <section class="search-section">
            <input type="text" id="searchBar" placeholder="Search for a CBSE Class 10 subject...">
        </section>

        <section class="subject-grid-container">
            <h2>3. Select a Subject:</h2>
            <div class="subject-grid" id="subjectGrid">
{chr(10).join(cards_html)}
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; 2026 EduHome | <a href="#">Disclaimer</a> | <a href="#">About</a></p>
    </footer>

    <script src="../script.js"></script>

</body>
</html>
'''
    out_path = os.path.join(OUTPUT_DIR, "cbse-class10.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"Generated: cbse-class10.html ({len(cards_html)} subjects)")


def generate_all_cbse_class10_pages():
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found.")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    by_year = data.get("by_year", {})
    years_desc = sorted(by_year.keys(), reverse=True)

    subject_summaries = {}

    for subj_key, cfg in SUBJECT_CONFIG.items():
        subj_name = cfg["name"]
        subj_icon = cfg["icon"]
        out_fn = cfg["file"]

        year_pills = []
        year_sections = []
        total_papers = 0
        years_present = []

        for year in years_desc:
            subj_entry = by_year[year].get("subjects", {}).get(subj_key)
            if not subj_entry:
                continue

            is_folder = subj_entry.get("type") == "google_drive_folder"
            sections = subj_entry.get("sections", [])
            year_cards_count = 0
            subsection_blocks = []

            for sec in sections:
                sec_title = sec.get("section_title", "Question Papers")
                sec_id = sec.get("section_id", "").lower()
                is_supp = "supplementary" in sec_id or "compartment" in sec_title.lower()
                papers = sec.get("papers", [])

                seen_ids = set()
                cards = []
                for p in papers:
                    pid = p.get("id") or p.get("question_paper_url") or p.get("title")
                    if pid in seen_ids:
                        continue
                    seen_ids.add(pid)
                    cards.append(render_paper_card(p, year, is_folder=is_folder, is_supplementary=is_supp))

                if not cards:
                    continue

                year_cards_count += len(cards)
                if len(sections) > 1 or is_supp:
                    icon_cls = "fa-rotate-right" if is_supp else "fa-file-lines"
                    subsection_blocks.append(f'''
                <div class="subsection-group">
                    <h3 class="subsection-heading"><i class="fa-solid {icon_cls}" style="color: #005a87;"></i> {esc(sec_title)}</h3>
                    <div class="cards-grid">
                        {"".join(cards)}
                    </div>
                </div>''')
                else:
                    subsection_blocks.append(f'''
                <div class="subsection-group">
                    <div class="cards-grid">
                        {"".join(cards)}
                    </div>
                </div>''')

            if year_cards_count == 0:
                continue

            years_present.append(year)
            total_papers += year_cards_count
            label_unit = "Folder" if is_folder and year_cards_count == 1 else ("Paper" if year_cards_count == 1 else "Papers")

            year_pills.append(f'<a href="#year-{year}" class="section-nav-pill">{year}</a>')
            year_sections.append(f'''
            <section id="year-{year}" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-calendar-days fa-lg" style="color: #005a87;"></i>
                        <h2>CBSE Class 10 Board Exam {year}</h2>
                    </div>
                    <span class="badge-count">{year_cards_count} {label_unit}</span>
                </div>
                {"".join(subsection_blocks)}
            </section>''')

        subject_summaries[subj_key] = {"years": years_present, "papers": total_papers}

        page_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(subj_name)} - CBSE Class 10 Previous Year Papers & Solutions | EduHome</title>
    <meta name="description" content="Download CBSE Class 10 {esc(subj_name)} Previous Year Board Question Papers (2013–2026) and Official Marking Scheme Solutions on Google Drive.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
    {CSS_TEMPLATE}
</head>
<body>

    <header class="subject-header">
        <h1><i class="fa-solid {subj_icon}"></i> {esc(subj_name)}</h1>
        <p>CBSE Class 10 Previous Year Board Question Papers & Official Solutions ({total_papers} Resources)</p>
    </header>

    <div class="container">
        <nav class="breadcrumbs">
            <a href="../index.html">Home</a> &gt; <a href="../cbse.html">CBSE Board</a> &gt; <a href="cbse-class10.html">Class 10</a> &gt; {esc(subj_name)}
        </nav>

        <div class="back-btn-box">
            <a href="cbse-class10.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back to Subjects</a>
        </div>

        <nav class="section-nav-pills" aria-label="Filter by Year">
            {"".join(year_pills)}
        </nav>

        <div class="search-box-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="paperSearch" class="search-input" placeholder="Search by year (e.g. 2025), paper code (e.g. 30-1-1), set, Delhi, Compartment..." onkeyup="filterPapers()">
        </div>

        <main>
            {"".join(year_sections)}
        </main>

        <footer>
            <p>&copy; 2026 EduHome | CBSE Class 10 Study Materials Portal | Powered by Google Drive</p>
        </footer>
    </div>

    {JS_FILTER}

</body>
</html>'''

        out_path = os.path.join(OUTPUT_DIR, out_fn)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page_html)
        print(f"Generated: {out_fn} ({len(years_present)} years, {total_papers} papers)")

    generate_subject_index(subject_summaries)


if __name__ == "__main__":
    generate_all_cbse_class10_pages()

