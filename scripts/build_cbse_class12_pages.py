import html
import json
import os

from scripts.build_cbse_class10_pages import CSS_TEMPLATE, JS_FILTER, esc, render_paper_card, render_subject_switcher

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "study-materials", "cbse_class12_pyq_data.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "study-materials", "cbse12")

SUBJECT_CONFIG = {
    "english_core": {
        "name": "English Core",
        "icon": "fa-book-open",
        "css_class": "english",
        "file": "cbse-class12-english-core.html",
    },
    "mathematics": {
        "name": "Mathematics",
        "icon": "fa-calculator",
        "css_class": "maths",
        "file": "cbse-class12-mathematics.html",
    },
    "applied_mathematics": {
        "name": "Applied Mathematics",
        "icon": "fa-square-root-variable",
        "css_class": "maths",
        "file": "cbse-class12-applied-maths.html",
    },
    "physics": {
        "name": "Physics",
        "icon": "fa-magnet",
        "css_class": "science",
        "file": "cbse-class12-physics.html",
    },
    "chemistry": {
        "name": "Chemistry",
        "icon": "fa-flask",
        "css_class": "science",
        "file": "cbse-class12-chemistry.html",
    },
    "biology": {
        "name": "Biology",
        "icon": "fa-dna",
        "css_class": "science",
        "file": "cbse-class12-biology.html",
    },
    "accountancy": {
        "name": "Accountancy",
        "icon": "fa-file-invoice-dollar",
        "css_class": "maths",
        "file": "cbse-class12-accountancy.html",
    },
    "business_studies": {
        "name": "Business Studies",
        "icon": "fa-briefcase",
        "css_class": "social",
        "file": "cbse-class12-business-studies.html",
    },
    "economics": {
        "name": "Economics",
        "icon": "fa-chart-line",
        "css_class": "social",
        "file": "cbse-class12-economics.html",
    },
    "hindi_core": {
        "name": "Hindi Core",
        "icon": "fa-language",
        "css_class": "hindi",
        "file": "cbse-class12-hindi-core.html",
    },
    "psychology": {
        "name": "Psychology",
        "icon": "fa-brain",
        "css_class": "art-health-we",
        "file": "cbse-class12-psychology.html",
    },
    "physical_education": {
        "name": "Physical Education",
        "icon": "fa-person-running",
        "css_class": "art-health-we",
        "file": "cbse-class12-physical-education.html",
    },
    "history": {
        "name": "History",
        "icon": "fa-landmark",
        "css_class": "social",
        "file": "cbse-class12-history.html",
    },
    "geography": {
        "name": "Geography",
        "icon": "fa-earth-americas",
        "css_class": "social",
        "file": "cbse-class12-geography.html",
    },
    "political_science": {
        "name": "Political Science",
        "icon": "fa-scale-balanced",
        "css_class": "social",
        "file": "cbse-class12-political-science.html",
    },
}


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
    <title>CBSE Board - Class 12 Previous Year Question Papers | EduHome</title>
    <meta name="description" content="Download CBSE Class 12 Previous Year Board Question Papers (2013–2026) and Official Marking Scheme Solutions by subject.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
</head>
<body>

    <header>
        <h1>CBSE Board - Class 12</h1>
        <p>Previous Year Question Papers & Official Marking Schemes (2013–2026)</p>
    </header>

    <nav class="breadcrumbs">
        <a href="../index.html">Home</a> &gt; <a href="../cbse.html">CBSE Board</a> &gt; Class 12
    </nav>
    <div class="back-link-container">
        <a href="../cbse.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Class Section</a>
    </div>
    <main>
        <section class="search-section">
            <input type="text" id="searchBar" placeholder="Search for a CBSE Class 12 subject...">
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
    out_path = os.path.join(OUTPUT_DIR, "cbse-class12.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"Generated: cbse-class12.html ({len(cards_html)} subjects)")


def generate_all_cbse_class12_pages():
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
                        <h2>CBSE Class 12 Board Exam {year}</h2>
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
    <title>{esc(subj_name)} - CBSE Class 12 Previous Year Papers & Solutions | EduHome</title>
    <meta name="description" content="Download CBSE Class 12 {esc(subj_name)} Previous Year Board Question Papers (2013–2026) and Official Marking Scheme Solutions on Google Drive.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
    {CSS_TEMPLATE}
</head>
<body>

    <header class="subject-header">
        <h1><i class="fa-solid {subj_icon}"></i> {esc(subj_name)}</h1>
        <p>CBSE Class 12 Previous Year Board Question Papers & Official Solutions ({total_papers} Resources)</p>
    </header>

    <div class="container">
        <nav class="breadcrumbs">
            <a href="../index.html">Home</a> &gt; <a href="../cbse.html">CBSE Board</a> &gt; <a href="cbse-class12.html">Class 12</a> &gt; {esc(subj_name)}
        </nav>

        <div class="top-nav-bar">
            <div class="back-btn-box">
                <a href="cbse-class12.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back to Subjects</a>
            </div>
            {render_subject_switcher(SUBJECT_CONFIG, subj_key)}
        </div>

        <nav class="section-nav-pills" aria-label="Filter by Year">
            {"".join(year_pills)}
        </nav>

        <div class="search-box-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="paperSearch" class="search-input" placeholder="Search by year (e.g. 2025), paper code (e.g. 65-1-1), set, Delhi, Compartment..." onkeyup="filterPapers()">
            <button type="button" id="searchClearBtn" class="search-clear-btn" aria-label="Clear search" onclick="clearPaperSearch()"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <main>
            <div id="noResultsMsg" class="no-results-msg">
                <i class="fa-solid fa-magnifying-glass fa-2x" style="margin-bottom: 10px; color: #94a3b8;"></i>
                <p style="margin: 0; font-weight: 600;">No matching question papers found.</p>
                <p style="margin: 6px 0 0 0; font-size: 0.9rem;">Try clearing your search or selecting a year above.</p>
            </div>
            {"".join(year_sections)}
        </main>

        <footer>
            <p>&copy; 2026 EduHome | CBSE Class 12 Study Materials Portal | Powered by Google Drive</p>
        </footer>
    </div>

    <button type="button" id="backToTopBtn" class="back-to-top-btn" aria-label="Back to top" onclick="scrollToTopSmooth()">
        <i class="fa-solid fa-arrow-up"></i>
    </button>

    {JS_FILTER}

</body>
</html>'''

        out_path = os.path.join(OUTPUT_DIR, out_fn)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page_html)
        print(f"Generated: {out_fn} ({len(years_present)} years, {total_papers} papers)")

    generate_subject_index(subject_summaries)


if __name__ == "__main__":
    import sys
    if BASE_DIR not in sys.path:
        sys.path.insert(0, BASE_DIR)
    generate_all_cbse_class12_pages()

