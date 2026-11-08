import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "study-materials", "cs12_structured_data.json")
MAP_PATH = os.path.join(BASE_DIR, "study-materials", "gdrive_files_map.json")
OUTPUT_DIR = os.path.join(BASE_DIR, "study-materials", "cs12")
DOWNLOADS_DIR = r"C:\Users\madhu\Downloads\downloaded_materials"

SUBJECT_MAP = {
    'maths': {'file': 'kerala-state-class12-maths.html', 'title': 'Mathematics', 'icon': 'fa-calculator', 'folder': 'Mathematics'},
    'physics': {'file': 'kerala-state-class12-physics.html', 'title': 'Physics', 'icon': 'fa-magnet', 'folder': 'Physics'},
    'chemistry': {'file': 'kerala-state-class12-chemistry.html', 'title': 'Chemistry', 'icon': 'fa-flask', 'folder': 'Chemistry'},
    'biology': {'file': 'kerala-state-class12-biology.html', 'title': 'Biology (Botany & Zoology)', 'icon': 'fa-dna', 'folder': 'Biology'},
    'computer_science_app': {'file': 'kerala-state-class12-computer.html', 'title': 'Computer Science / App', 'icon': 'fa-laptop-code', 'folder': 'Computer Science  App'},
    'commerce': {'file': 'kerala-state-class12-commerce.html', 'title': 'Commerce (Accountancy / Business Studies)', 'icon': 'fa-chart-line', 'folder': 'Commerce (AccountancyBusiness)'},
    'humanities': {'file': 'kerala-state-class12-humanities.html', 'title': 'Humanities (History / Geography / Economics / Political Science)', 'icon': 'fa-landmark', 'folder': 'Humanities (HistoryGeogEcon)'},
    'social_science': {'file': 'kerala-state-class12-social.html', 'title': 'Social Science (Sociology & Social Work)', 'icon': 'fa-globe', 'folder': 'Social Science'},
    'english': {'file': 'kerala-state-class12-english.html', 'title': 'English', 'icon': 'fa-book-open', 'folder': 'English'},
    'malayalam': {'file': 'kerala-state-class12-malayalam1.html', 'title': 'Malayalam I', 'icon': 'fa-feather-pointed', 'folder': 'Malayalam I'},
    'hindi': {'file': 'kerala-state-class12-hindi.html', 'title': 'Hindi', 'icon': 'fa-language', 'folder': 'Hindi'},
    'arabic': {'file': 'kerala-state-class12-arabic.html', 'title': 'Arabic', 'icon': 'fa-moon', 'folder': 'Arabic'},
    'model_revision_pools': {'file': 'kerala-state-class12-general.html', 'title': 'All Subjects (Model & Revision Pools)', 'icon': 'fa-folder-open', 'folder': 'All Subjects (Model & Revision Pools)'}
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
        --badge-science: #0284c7;
        --badge-commerce: #d97706;
        --badge-humanities: #7c3aed;
        --badge-general: #475569;
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
    .badge-stream-science { background: #dcfce7; color: #15803d; }
    .badge-stream-commerce { background: #fef3c7; color: #b45309; }
    .badge-stream-humanities { background: #f3e8ff; color: #7e22ce; }
    .badge-term { background: #ede9fe; color: #6d28d9; }
    .badge-med { background: #f1f5f9; color: #475569; }

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

    .btn-secondary {
        background-color: #f1f5f9;
        color: #334155;
        border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover {
        background-color: #e2e8f0;
    }

    .btn.disabled {
        background-color: #f1f5f9;
        color: #94a3b8;
        pointer-events: none;
    }

    .sub-subject-block {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px;
        margin-top: 8px;
    }

    .sub-subject-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #475569;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .practice-sets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
    }

    .practice-set-card {
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 14px;
        text-align: center;
        text-decoration: none;
        color: var(--text-dark);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
    }

    .practice-set-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        border-color: var(--secondary-blue);
        color: var(--secondary-blue);
    }

    .practice-set-card i {
        font-size: 1.5rem;
        color: #dc2626;
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

JS_FILTER_SCRIPT = """
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

def generate_all_class12_pages():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    drive_map = {}
    if os.path.exists(MAP_PATH):
        try:
            with open(MAP_PATH, 'r', encoding='utf-8') as f:
                drive_map = json.load(f)
        except Exception as e:
            print(f"Warning loading drive_map: {e}")

    lookup_by_rel = {}
    lookup_by_fn = {}

    for path_key, info in drive_map.items():
        url = info.get('url', '#')
        norm = path_key.replace('\\', '/').strip('/')
        lookup_by_rel[norm.lower()] = url
        fn = os.path.basename(path_key).lower()
        lookup_by_fn[fn] = url

    def get_link(path_or_dict):
        if not path_or_dict:
            return "#"
        raw_path = ""
        if isinstance(path_or_dict, dict):
            raw_path = path_or_dict.get('local_path', '')
        elif isinstance(path_or_dict, str):
            raw_path = path_or_dict
            
        if not raw_path:
            return "#"
            
        norm = raw_path.replace('\\', '/').strip('/').lower()
        if norm in lookup_by_rel:
            return lookup_by_rel[norm]
            
        fn = os.path.basename(raw_path).lower()
        if fn in lookup_by_fn:
            return lookup_by_fn[fn]
            
        return "#"

    def render_btn(label, path_or_dict, btn_class="btn-qp", icon="fa-file-pdf"):
        url = get_link(path_or_dict)
        if url == "#":
            return f'<span class="btn {btn_class} disabled" title="Uploading to Google Drive..."><i class="fa-solid {icon}"></i> {label}</span>'
        return f'<a href="{url}" target="_blank" rel="noopener noreferrer" class="btn {btn_class}"><i class="fa-solid {icon}"></i> {label}</a>'

    def render_qp_buttons(item):
        html = []
        if 'question_paper' in item:
            qp = item['question_paper']
            title = "Question Paper"
            if isinstance(qp, dict) and 'title' in qp and len(qp['title']) < 30:
                title = qp['title']
            html.append(render_btn(title, qp, "btn-qp", "fa-file-pdf"))
        elif 'question_papers' in item:
            qps = item['question_papers']
            if isinstance(qps, list):
                for i, q in enumerate(qps):
                    lbl = "Question Paper"
                    if isinstance(q, dict):
                        if 'medium' in q:
                            lbl = f"QP ({q['medium']} Med)"
                        elif 'title' in q:
                            lbl = q['title'][:25]
                    elif isinstance(q, str):
                        if 'Mal Med' in q or 'MM' in q:
                            lbl = "QP (Mal Med)"
                        elif 'Eng Med' in q or 'EM' in q:
                            lbl = "QP (Eng Med)"
                        else:
                            lbl = f"QP {i+1}"
                    html.append(render_btn(lbl, q, "btn-qp", "fa-file-pdf"))
        return html

    def render_key_buttons(item):
        html = []
        if 'answer_key' in item:
            ak = item['answer_key']
            lbl = "Answer Key"
            if isinstance(ak, dict):
                if 'source' in ak:
                    lbl = f"Key ({ak['source']})"
                elif 'title' in ak and len(ak['title']) < 30:
                    lbl = ak['title']
            html.append(render_btn(lbl, ak, "btn-key", "fa-circle-check"))
        elif 'answer_keys' in item:
            aks = item['answer_keys']
            if isinstance(aks, list):
                for i, k in enumerate(aks):
                    lbl = "Answer Key"
                    if isinstance(k, dict):
                        if 'source' in k:
                            lbl = f"Key ({k['source']})"
                        elif 'title' in k:
                            lbl = k['title'][:25]
                    elif isinstance(k, str):
                        lbl = f"Key {i+1}"
                    html.append(render_btn(lbl, k, "btn-key", "fa-circle-check"))
        return html

    def render_card(item, subject_name, default_type="Annual Exam"):
        year = item.get('year', '')
        stream = item.get('stream', '')
        medium = item.get('medium', '')
        term = item.get('term', '')
        spec = item.get('specialization', '')
        paper = item.get('paper', '')

        badges = []
        if year:
            badges.append(f'<span class="badge badge-year">{year}</span>')
        if term:
            badges.append(f'<span class="badge badge-term">{term}</span>')
        if stream:
            st_class = "badge-stream-science" if "Science" in stream else "badge-stream-commerce" if "Commerce" in stream else "badge-stream-humanities"
            badges.append(f'<span class="badge {st_class}">{stream}</span>')
        if spec:
            badges.append(f'<span class="badge badge-med">{spec}</span>')
        if paper:
            badges.append(f'<span class="badge badge-med">{paper}</span>')
        if medium and medium != "English":
            badges.append(f'<span class="badge badge-med">{medium}</span>')

        title = f"{year} {default_type}" if year else default_type
        if term:
            title = f"{term} Exam {year}" if year else f"{term} Exam"
        if spec:
            title += f" - {spec}"
        elif paper:
            title += f" - {paper}"
        elif stream and stream not in title:
            title += f" ({stream})"

        sub_blocks = []
        if 'botany' in item or 'zoology' in item:
            if 'botany' in item:
                b_item = item['botany']
                b_qps = render_qp_buttons(b_item)
                b_keys = render_key_buttons(b_item)
                sub_blocks.append(f'''
                <div class="sub-subject-block">
                    <div class="sub-subject-title"><i class="fa-solid fa-leaf"></i> Botany</div>
                    <div class="action-group">{"".join(b_qps + b_keys)}</div>
                </div>''')
            if 'zoology' in item:
                z_item = item['zoology']
                z_qps = render_qp_buttons(z_item)
                z_keys = render_key_buttons(z_item)
                sub_blocks.append(f'''
                <div class="sub-subject-block">
                    <div class="sub-subject-title"><i class="fa-solid fa-paw"></i> Zoology</div>
                    <div class="action-group">{"".join(z_qps + z_keys)}</div>
                </div>''')

        if 'papers' in item and isinstance(item['papers'], list):
            for p in item['papers']:
                p_sub = p.get('subject', p.get('name', 'Paper'))
                p_qps = render_qp_buttons(p)
                p_keys = render_key_buttons(p)
                sub_blocks.append(f'''
                <div class="sub-subject-block">
                    <div class="sub-subject-title"><i class="fa-solid fa-file"></i> {p_sub}</div>
                    <div class="action-group">{"".join(p_qps + p_keys)}</div>
                </div>''')

        if 'business_studies_papers' in item:
            bs_item = {'question_papers': item['business_studies_papers']}
            bs_qps = render_qp_buttons(bs_item)
            sub_blocks.append(f'''
            <div class="sub-subject-block">
                <div class="sub-subject-title"><i class="fa-solid fa-briefcase"></i> Business Studies</div>
                <div class="action-group">{"".join(bs_qps)}</div>
            </div>''')

        direct_qps = render_qp_buttons(item)
        direct_keys = render_key_buttons(item)

        actions_html = ""
        if direct_qps or direct_keys:
            actions_html += f'<div class="action-group">{"".join(direct_qps + direct_keys)}</div>'
        if sub_blocks:
            actions_html += "".join(sub_blocks)

        return f'''
        <div class="exam-card">
            <div class="card-top">
                <div class="card-badges">{"".join(badges)}</div>
                <h3 class="card-title">{title}</h3>
            </div>
            <div class="card-actions">
                {actions_html}
            </div>
        </div>'''

    for subject in data['subjects']:
        sub_id = subject['subject_id']
        cfg = SUBJECT_MAP.get(sub_id)
        if not cfg:
            continue

        sub_name = subject['subject_name']
        icon = cfg['icon']
        filename = cfg['file']
        folder_name = cfg['folder']
        res = subject.get('resources', {})

        annual_items = res.get('board_annual_exams', [])
        annual_cards = [render_card(it, sub_name, "Annual Board Exam") for it in annual_items]

        model_items = res.get('model_exams', [])
        model_cards = [render_card(it, sub_name, "Model Exam") for it in model_items]

        terminal_items = res.get('terminal_exams', [])
        terminal_cards = [render_card(it, sub_name, "Terminal Exam") for it in terminal_items]

        practice_cards = []
        if 'model_practice_sets' in res and isinstance(res['model_practice_sets'], list):
            for ps in res['model_practice_sets']:
                set_lbl = f"Set {ps.get('set', '')}" if 'set' in ps else "Practice Set"
                link = get_link(ps)
                cls_name = "practice-set-card"
                if link == "#":
                    cls_name += " disabled"
                practice_cards.append(f'''
                <a href="{link}" target="_blank" rel="noopener noreferrer" class="{cls_name}">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span class="set-label">{set_lbl}</span>
                </a>''')

        local_sub_folder = os.path.join(DOWNLOADS_DIR, folder_name)
        if os.path.exists(local_sub_folder):
            extra_models = [f for f in os.listdir(local_sub_folder) if ('Model Question Paper' in f or 'Model Question paper' in f)]
            def extract_num(fn):
                m = re.search(r'\b(\d+)\b', fn)
                return int(m.group(1)) if m else 999
            extra_models.sort(key=extract_num)

            if len(extra_models) > len(practice_cards):
                practice_cards = []
                for fn in extra_models:
                    rel = f"downloaded_materials/{folder_name}/{fn}"
                    link = get_link(rel)
                    clean_lbl = fn.replace('Kerala Plus Two ', '').replace('Kerala HSE 12th ', '').replace('Kerala HSE Plus two ', '').replace('.pdf', '')
                    practice_cards.append(f'''
                    <a href="{link}" target="_blank" rel="noopener noreferrer" class="practice-set-card">
                        <i class="fa-solid fa-file-pdf"></i>
                        <span class="set-label">{clean_lbl}</span>
                    </a>''')

        pools_cards = []
        if 'key_collections' in subject:
            for col in subject['key_collections']:
                col_name = col.get('name', 'Pool Collection')
                sample_file = col.get('sample_file', '')
                sample_link = get_link(sample_file)
                years = ", ".join(col.get('years_covered', []))
                subjs = ", ".join(col.get('subjects_included', [])[:8]) + "..."
                pools_cards.append(f'''
                <div class="exam-card">
                    <div class="card-top">
                        <div class="card-badges">
                            <span class="badge badge-year">{years}</span>
                            <span class="badge badge-term">All Subjects Pool</span>
                        </div>
                        <h3 class="card-title">{col_name}</h3>
                        <p class="card-subtitle"><strong>Subjects Included:</strong> {subjs}</p>
                    </div>
                    <div class="card-actions">
                        <a href="{sample_link}" target="_blank" rel="noopener noreferrer" class="btn btn-qp">
                            <i class="fa-solid fa-folder-open"></i> Browse / Open Sample Paper
                        </a>
                    </div>
                </div>''')

        sections_html = []
        nav_pills = []

        if annual_cards:
            nav_pills.append('<a href="#board-exams" class="section-nav-pill"><i class="fa-solid fa-graduation-cap"></i> Board Exams</a>')
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
            nav_pills.append('<a href="#model-exams" class="section-nav-pill"><i class="fa-solid fa-file-signature"></i> Model Exams</a>')
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
            nav_pills.append('<a href="#terminal-exams" class="section-nav-pill"><i class="fa-solid fa-calendar-check"></i> Terminal Exams</a>')
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
            nav_pills.append('<a href="#practice-sets" class="section-nav-pill"><i class="fa-solid fa-layer-group"></i> Practice Sets</a>')
            sections_html.append(f'''
            <section id="practice-sets" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-layer-group fa-lg" style="color: #005a87;"></i>
                        <h2>Model Practice Question Paper Sets</h2>
                    </div>
                    <span class="badge-count">{len(practice_cards)} Sets</span>
                </div>
                <div class="practice-sets-grid">
                    {"".join(practice_cards)}
                </div>
            </section>''')

        if pools_cards:
            nav_pills.append('<a href="#revision-pools" class="section-nav-pill"><i class="fa-solid fa-folder-tree"></i> Revision Pools</a>')
            sections_html.append(f'''
            <section id="revision-pools" class="exam-section">
                <div class="section-title-bar">
                    <div class="title-group">
                        <i class="fa-solid fa-folder-tree fa-lg" style="color: #005a87;"></i>
                        <h2>Key Multi-Year Revision Pools</h2>
                    </div>
                    <span class="badge-count">{len(pools_cards)} Pools</span>
                </div>
                <div class="cards-grid">
                    {"".join(pools_cards)}
                </div>
            </section>''')

        full_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{sub_name} - Class 12 (Plus Two) Question Papers & Keys | EduHome</title>
    <meta name="description" content="Download Kerala State Higher Secondary Education Class 12 (Plus Two) {sub_name} Previous Year Board Question Papers, Model Exams, and Answer Keys on Google Drive.">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="../styles.css">
    {CSS_TEMPLATE}
</head>
<body>

    <header class="subject-header">
        <h1><i class="fa-solid {icon}"></i> {sub_name}</h1>
        <p>Class 12 (Plus Two) Previous Year Question Papers & Official Solutions</p>
    </header>

    <div class="container">
        <nav class="breadcrumbs">
            <a href="../index.html">Home</a> &gt; <a href="../kerala-state.html">Kerala State Board</a> &gt; <a href="kerala-state-class12.html">Class 12 (Plus Two)</a> &gt; {sub_name}
        </nav>

        <div class="back-btn-box">
            <a href="kerala-state-class12.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back to Subjects</a>
        </div>

        <nav class="section-nav-pills">
            {"".join(nav_pills)}
        </nav>

        <div class="search-box-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="paperSearch" class="search-input" placeholder="Search by year (e.g. 2026), stream, medium, or keyword..." onkeyup="filterPapers()">
        </div>

        <main>
            {"".join(sections_html)}
        </main>

        <footer>
            <p>© 2026 EduHome | Kerala State Board Class 12 Study Materials Portal | Powered by Google Drive</p>
        </footer>
    </div>

    {JS_FILTER_SCRIPT}

</body>
</html>
'''

        out_file = os.path.join(OUTPUT_DIR, filename)
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(full_html)
        print(f"Generated: {filename} ({len(annual_cards)} Annual, {len(model_cards)} Model, {len(terminal_cards)} Terminal, {len(practice_cards)} Practice Sets)")

if __name__ == '__main__':
    generate_all_class12_pages()
    print("All 13 Class 12 pages successfully generated!")

