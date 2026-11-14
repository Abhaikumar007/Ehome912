import html
import json
import os
import re

from scripts.build_cbse_class10_pages import CSS_TEMPLATE, JS_FILTER, esc

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "study-materials", "plus_one_structured_data.json")
MAP_PATH = os.path.join(BASE_DIR, "study-materials", "plus_one_gdrive_map.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "study-materials", "cs11")

SUBJECT_CONFIG = [
    {
        "key": "Mathematics",
        "file": "kerala-state-class11-maths.html",
        "title": "Mathematics",
        "icon": "fa-calculator",
        "css_class": "maths",
    },
    {
        "key": "Physics",
        "file": "kerala-state-class11-physics.html",
        "title": "Physics",
        "icon": "fa-magnet",
        "css_class": "physics",
    },
    {
        "key": "Chemistry",
        "file": "kerala-state-class11-chemistry.html",
        "title": "Chemistry",
        "icon": "fa-flask",
        "css_class": "chemistry",
    },
    {
        "key": "Biology",
        "file": "kerala-state-class11-biology.html",
        "title": "Biology",
        "icon": "fa-dna",
        "css_class": "biology",
    },
    {
        "key": "Computer Science / App",
        "file": "kerala-state-class11-computer.html",
        "title": "Computer Science / App",
        "icon": "fa-laptop-code",
        "css_class": "computer",
    },
    {
        "key": "Commerce (Accountancy/Business)",
        "file": "kerala-state-class11-commerce.html",
        "title": "Commerce (Accountancy/Business)",
        "icon": "fa-chart-line",
        "css_class": "commerce",
    },
    {
        "key": "Humanities (History/Geog/Econ)",
        "file": "kerala-state-class11-humanities.html",
        "title": "Humanities (History/Geog/Econ)",
        "icon": "fa-landmark",
        "css_class": "humanities",
    },
    {
        "key": "Social Science",
        "file": "kerala-state-class11-social.html",
        "title": "Social Science",
        "icon": "fa-globe",
        "css_class": "social",
    },
    {
        "key": "English",
        "file": "kerala-state-class11-english.html",
        "title": "English",
        "icon": "fa-book-open",
        "css_class": "english",
    },
    {
        "key": "Malayalam I",
        "file": "kerala-state-class11-malayalam1.html",
        "title": "Malayalam I",
        "icon": "fa-feather-pointed",
        "css_class": "malayalam1",
    },
    {
        "key": "Hindi",
        "file": "kerala-state-class11-hindi.html",
        "title": "Hindi",
        "icon": "fa-language",
        "css_class": "hindi",
    },
    {
        "key": "Arabic",
        "file": "kerala-state-class11-arabic.html",
        "title": "Arabic",
        "icon": "fa-moon",
        "css_class": "arabic",
    },
    {
        "key": "All Subjects (Model & Revision Pools)",
        "file": "kerala-state-class11-general.html",
        "title": "All Subjects (Model & Revision Pools)",
        "icon": "fa-folder-open",
        "css_class": "general",
    },
    {
        "key": "Other Subjects (Statistics, Urdu, Sanskrit, French, Electronics, Geology, Home Science)",
        "file": "kerala-state-class11-other.html",
        "title": "Other Subjects (Statistics, Urdu, Sanskrit, French, Electronics, Geology, Home Science)",
        "icon": "fa-layer-group",
        "css_class": "general",
    },
]


def classify_exam_type(title):
    t = title.lower()
    if any(k in t for k in ["model", "pre model", "pre-model"]):
        return "Model Exams"
    if any(k in t for k in ["improvement", "say "]):
        return "Improvement / SAY Exams"
    if any(k in t for k in ["first term", "onam", "second term", "2nd term", "christmas", "half yearly", "iind term"]):
        return "Term / Onam / Christmas Exams"
    if any(k in t for k in ["question bank", "notes"]):
        return "Question Banks & Notes"
    if any(k in t for k in ["annual", "board", "final", "march", "june"]):
        return "Annual / Board Exams"
    return "Other Question Papers"


def is_answer_key(filename):
    f = filename.lower()
    return any(
        k in f
        for k in [
            "key",
            "answer",
            "ans ",
            "_ans",
            "-ans",
            "solution",
            "sol.",
            "marking scheme",
        ]
    )


def detect_medium(filename):
    f = filename.lower()
    if any(k in f for k in ["mal med", "malayalam med", " mm", "_mm", "(mm)", "-mm"]):
        return "Mal Med"
    if any(k in f for k in ["eng med", "english med", " em", "_em", "(em)", "-em"]):
        return "Eng Med"
    return ""


def short_label(filename, is_key):
    med = detect_medium(filename)
    base = "Answer Key" if is_key else "Question Paper"
    # Check if filename has a specific subject or set name when thread is multi-subject
    stem = os.path.splitext(filename)[0]
    if len(stem) <= 36:
        return stem
    if med:
        return f"{base} ({med})"
    return f"{base}"


def render_thread_card(thread, gdrive_map):
    year = thread.get("year", "")
    title = thread.get("title", "")
    exam_type = classify_exam_type(title)
    attachments = thread.get("attachments", [])

    qp_buttons = []
    key_buttons = []
    seen_urls = set()

    for att in attachments:
        rel_path = att.get("rel_path", "")
        url = gdrive_map.get(rel_path)
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        fname = att.get("name", rel_path.split("/")[-1])
        is_key = is_answer_key(fname)
        med = detect_medium(fname)
        badge_prefix = f"[{med}] " if med else ""
        # Keep readable filename tooltip/label
        display_name = fname
        if len(display_name) > 52:
            display_name = display_name[:49].rstrip() + "..."
        icon = "fa-circle-check" if is_key else "fa-file-pdf"
        cls = "btn-key" if is_key else "btn-qp"
        btn_html = (
            f'<a href="{esc(url)}" target="_blank" rel="noopener" '
            f'class="btn {cls}" title="{esc(fname)}">'
            f'<i class="fa-solid {icon}"></i> {esc(badge_prefix + display_name)}</a>'
        )
        if is_key:
            key_buttons.append(btn_html)
        else:
            qp_buttons.append(btn_html)

    if not qp_buttons and not key_buttons:
        return None

    badges = []
    if year:
        badges.append(f'<span class="badge badge-year">{esc(year)}</span>')
    badges.append(f'<span class="badge badge-code">{esc(exam_type)}</span>')

    actions_parts = []
    if qp_buttons:
        actions_parts.append(f'<div class="action-group">{"".join(qp_buttons)}</div>')
    if key_buttons:
        actions_parts.append(f'<div class="action-group">{"".join(key_buttons)}</div>')

    return f'''
        <div class="exam-card">
            <div class="card-top">
                <div class="card-badges">
                    {"".join(badges)}
                </div>
                <h4 class="card-title">{esc(title)}</h4>
            </div>
            <div class="card-actions">
                {"".join(actions_parts)}
            </div>
        </div>'''


def generate_class11_index(subject_summaries):
    cards_html = []
    for cfg in SUBJECT_CONFIG:
        stats = subject_summaries.get(cfg["key"], {"threads": 0, "files": 0})
        detail = f'{stats["threads"]} Topics • {stats["files"]} PDFs' if stats["files"] else "Coming Soon"
        cards_html.append(
            f'''                <a href="{cfg["file"]}" class="subject-card {cfg["css_class"]}" data-subject="{esc(cfg["title"].lower())}">
                    <i class="fa-solid {cfg["icon"]} fa-3x"></i>
                    <span class="subject-name">{esc(cfg["title"])}</span>
                    <span class="subject-detail">{esc(detail)}</span>
                </a>'''
        )

    index_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kerala State Board - Class 11 (Plus One) Papers | EduHome</title>
    <meta name="description" content="Find Kerala State Board Class 11 (Plus One) Annual Exam, Model Exam, and Term Question Papers and Answer Keys by subject.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
</head>
<body>

    <header>
        <h1>Kerala State Board - Class 11 (Plus One)</h1>
        <p>Select a Subject</p>
    </header>

    <nav class="breadcrumbs">
        <a href="../index.html">Home</a> &gt; <a href="../kerala-state.html">Kerala State Board</a> &gt; Class 11 (Plus One)
    </nav>
    <div class="back-link-container">
        <a href="../kerala-state.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Class Section</a>
    </div>
    <main>
        <section class="search-section">
            <input type="text" id="searchBar" placeholder="Search for a Class 11 (Plus One) subject...">
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
    out_path = os.path.join(OUTPUT_DIR, "kerala-state-class11.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"Generated: kerala-state-class11.html ({len(cards_html)} subjects)")


def generate_all_class11_pages():
    if not os.path.exists(DATA_PATH) or not os.path.exists(MAP_PATH):
        print(f"Skipping Class 11 new generator: missing {DATA_PATH} or {MAP_PATH}")
        return False

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    with open(MAP_PATH, "r", encoding="utf-8") as f:
        gdrive_map = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    subject_summaries = {}

    for cfg in SUBJECT_CONFIG:
        subj_key = cfg["key"]
        subj_title = cfg["title"]
        subj_icon = cfg["icon"]
        out_fn = cfg["file"]

        threads = data.get(subj_key, [])
        by_year = {}
        total_files = 0
        total_threads = 0

        for th in threads:
            card_html = render_thread_card(th, gdrive_map)
            if not card_html:
                continue
            yr = str(th.get("year") or "Other")
            by_year.setdefault(yr, []).append(card_html)
            total_threads += 1
            total_files += sum(
                1 for att in th.get("attachments", []) if att.get("rel_path") in gdrive_map
            )

        years_desc = sorted(by_year.keys(), reverse=True)
        year_pills = [f'<a href="#year-{esc(yr)}" class="section-nav-pill">{esc(yr)}</a>' for yr in years_desc]

        year_sections = []
        for yr in years_desc:
            cards = by_year[yr]
            unit = "Paper Set" if len(cards) == 1 else "Paper Sets"
            year_sections.append(
                f'''
            <section id="year-{esc(yr)}" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-calendar-days fa-lg" style="color: #005a87;"></i>
                        <h2>{esc(yr)} Question Papers &amp; Keys</h2>
                    </div>
                    <span class="badge-count">{len(cards)} {unit}</span>
                </div>
                <div class="cards-grid">
                    {"".join(cards)}
                </div>
            </section>'''
            )

        if not year_sections:
            year_sections.append(
                '''
            <section class="exam-section">
                <div class="exam-card">
                    <p style="margin:0; color: var(--text-muted);">No papers are currently listed for this subject. Please check <strong>All Subjects (Model &amp; Revision Pools)</strong> for combined papers.</p>
                </div>
            </section>'''
            )

        subject_summaries[subj_key] = {"threads": total_threads, "files": total_files}

        page_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(subj_title)} - Kerala Plus One (Class 11) Papers | EduHome</title>
    <meta name="description" content="Download Kerala State Board Class 11 (Plus One) {esc(subj_title)} Question Papers and Answer Keys on Google Drive.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
    {CSS_TEMPLATE}
</head>
<body>

    <header class="subject-header">
        <h1><i class="fa-solid {subj_icon}"></i> {esc(subj_title)}</h1>
        <p>Kerala Plus One (Class 11) Question Papers &amp; Answer Keys ({total_files} PDFs)</p>
    </header>

    <div class="container">
        <nav class="breadcrumbs">
            <a href="../index.html">Home</a> &gt; <a href="../kerala-state.html">Kerala State Board</a> &gt; <a href="kerala-state-class11.html">Class 11 (Plus One)</a> &gt; {esc(subj_title)}
        </nav>

        <div class="back-btn-box">
            <a href="kerala-state-class11.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back to Subjects</a>
        </div>

        <nav class="section-nav-pills" aria-label="Filter by Year">
            {"".join(year_pills)}
        </nav>

        <div class="search-box-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="paperSearch" class="search-input" placeholder="Search by year (e.g. 2025), exam (Model, Annual, Onam, Christmas), Mal Med / Eng Med..." onkeyup="filterPapers()">
        </div>

        <main>
            {"".join(year_sections)}
        </main>

        <footer>
            <p>&copy; 2026 EduHome | Kerala State Board Class 11 Portal | Powered by Google Drive</p>
        </footer>
    </div>

    {JS_FILTER}

</body>
</html>'''

        out_path = os.path.join(OUTPUT_DIR, out_fn)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page_html)
        print(f"Generated: {out_fn} ({len(years_desc)} years, {total_threads} sets, {total_files} PDFs)")

    generate_class11_index(subject_summaries)
    return True


if __name__ == "__main__":
    generate_all_class11_pages()

