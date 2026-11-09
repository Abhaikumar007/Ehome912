import os
import json
import re
import hashlib
from collections import defaultdict

ROOT = r"C:\Users\madhu\Downloads\downloaded_sslc_materials"
MANIFEST_PATH = os.path.join(ROOT, "all_attachments_manifest.json")
OUTPUT_STRUCTURED = r"c:\Users\madhu\code_test\study-materials\cs10_structured_data.json"

SUBJECT_DEFS = {
    'maths': {'name': 'Mathematics', 'icon': 'fa-calculator', 'file': 'kerala-state-class10-maths.html'},
    'physics': {'name': 'Physics', 'icon': 'fa-magnet', 'file': 'kerala-state-class10-physics.html'},
    'chemistry': {'name': 'Chemistry', 'icon': 'fa-flask', 'file': 'kerala-state-class10-chemistry.html'},
    'biology': {'name': 'Biology', 'icon': 'fa-dna', 'file': 'kerala-state-class10-biology.html'},
    'social': {'name': 'Social Science', 'icon': 'fa-globe', 'file': 'kerala-state-class10-social.html'},
    'english': {'name': 'English', 'icon': 'fa-book-open', 'file': 'kerala-state-class10-english.html'},
    'malayalam1': {'name': 'Malayalam I', 'icon': 'fa-feather-pointed', 'file': 'kerala-state-class10-malayalam1.html'},
    'malayalam2': {'name': 'Malayalam II', 'icon': 'fa-scroll', 'file': 'kerala-state-class10-malayalam2.html'},
    'hindi': {'name': 'Hindi', 'icon': 'fa-language', 'file': 'kerala-state-class10-hindi.html'},
    'arabic': {'name': 'Arabic', 'icon': 'fa-moon', 'file': 'kerala-state-class10-arabic.html'},
    'general': {'name': 'All Subjects (Model & Revision Pools)', 'icon': 'fa-folder-open', 'file': 'kerala-state-class10-general.html'}
}

def get_file_hash(full_path):
    if not os.path.exists(full_path):
        return None
    try:
        hasher = hashlib.md5()
        with open(full_path, 'rb') as f:
            # Read 64k chunks
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None

def detect_subject(item):
    orig = item.get('subject', '')
    title = (item.get('file_title', '') + ' ' + item.get('thread_title', '')).lower()
    
    if orig and orig != 'All Subjects (Model & Revision Pools)':
        sub = orig.lower()
        if 'malayalam ii' in sub or 'malayalam 2' in sub: return 'malayalam2'
        if 'malayalam i' in sub or 'malayalam 1' in sub: return 'malayalam1'
        if 'math' in sub: return 'maths'
        if 'physic' in sub: return 'physics'
        if 'chemist' in sub: return 'chemistry'
        if 'biolog' in sub: return 'biology'
        if 'social' in sub: return 'social'
        if 'english' in sub: return 'english'
        if 'hindi' in sub: return 'hindi'
        if 'arabic' in sub: return 'arabic'
        
    # Check title heuristics for pool items
    if 'malayalam ii' in title or 'malayalam 2' in title or 'adisthana' in title or 'adistana' in title or 'basic malayalam' in title:
        return 'malayalam2'
    if 'malayalam i' in title or 'malayalam 1' in title or 'kerala padavali' in title:
        return 'malayalam1'
    if any(k in title for k in ['math', 'ganitham', 'algebra', 'geometry', 'arithmetic']):
        return 'maths'
    if any(k in title for k in ['physic', 'bhouthika']):
        return 'physics'
    if any(k in title for k in ['chemist', 'rasathanthra']):
        return 'chemistry'
    if any(k in title for k in ['biolog', 'jeevasasthra', 'botany', 'zoology']):
        return 'biology'
    if any(k in title for k in ['social science', 'samuhyasasthra', 'social', 'history', 'geography', 'civics', 'economics']):
        return 'social'
    if 'english' in title:
        return 'english'
    if 'hindi' in title:
        return 'hindi'
    if 'arabic' in title:
        return 'arabic'
    if 'malayalam' in title:
        return 'malayalam1'
        
    return 'general'

def detect_section(title_lower):
    # Terminal
    if any(k in title_lower for k in ['first term', '1st term', 'onam', 'second term', '2nd term', 'christmas', 'xmas', 'mid term', 'midterm', 'half yearly']):
        return 'terminal_exams'
    # Model
    if any(k in title_lower for k in ['model exam', 'model question', 'pre model', 'pre-model', 'sample question paper', 'diet', 'sample paper']):
        return 'model_exams'
    # Annual Board
    if any(k in title_lower for k in ['annual', 'march', 'final exam', 'sslc exam march', 'board exam', 'public exam', 'say exam', 'kerala sslc exam']):
        return 'board_annual_exams'
    return 'practice_revision_pools'

def detect_term(title_lower):
    if any(k in title_lower for k in ['first term', '1st term', 'onam']):
        return 'First Term (Onam)'
    if any(k in title_lower for k in ['second term', '2nd term', 'christmas', 'xmas']):
        return 'Second Term (Christmas)'
    if any(k in title_lower for k in ['half yearly', 'mid term', 'midterm']):
        return 'Half Yearly / Mid Term'
    return None

def detect_medium(title_lower):
    if '(mm)' in title_lower or 'malayalam medium' in title_lower or 'mal med' in title_lower or 'malayalam ver' in title_lower:
        return 'Malayalam Medium'
    if '(em)' in title_lower or 'english medium' in title_lower or 'eng med' in title_lower or 'english ver' in title_lower:
        return 'English Medium'
    return ''

def detect_is_key(file_title_lower, thread_title_lower=""):
    if any(k in file_title_lower for k in ['question paper', 'question_paper', 'qp']):
        return False
    if any(k in file_title_lower for k in ['answer key', 'solution', 'ans key', 'scoring key', 'solved', 'answers', 'key']):
        return True
    return any(k in thread_title_lower for k in ['answer key', 'solution', 'ans key', 'scoring key']) and not any(k in file_title_lower for k in ['question', 'paper'])

def extract_year(item, title_lower):
    y = item.get('year', '')
    if y and y.isdigit() and 2000 <= int(y) <= 2030:
        return int(y)
    match = re.search(r'\b(20[0-2][0-9])\b', title_lower)
    if match:
        return int(match.group(1))
    return None

def clean_item_title(raw_title):
    # Remove leading year prefixes like '2023_' or '2022_'
    t = re.sub(r'^\d{4}_', '', raw_title)
    t = re.sub(r'\.pdf$', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def main():
    print("Reading manifest...")
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        raw_items = json.load(f)
    print(f"Total raw items: {len(raw_items)}")

    # Step 1: De-duplication
    # Group by hash and by normalized filename
    seen_hashes = {}
    seen_filenames = {}
    unique_items = []
    duplicates_dropped = 0

    for item in raw_items:
        local_rel = item.get('local_path', '')
        full_p = os.path.join(r"C:\Users\madhu\Downloads", local_rel) if not os.path.isabs(local_rel) else local_rel
        
        # Check hash
        f_hash = get_file_hash(full_p)
        fn_clean = os.path.basename(local_rel).lower().strip()
        
        # Preference: specific subject over Revision Pool
        is_pool = item.get('subject') == 'All Subjects (Model & Revision Pools)'

        if f_hash:
            if f_hash in seen_hashes:
                existing_item, existing_idx = seen_hashes[f_hash]
                # If existing was pool and this is specific subject, replace it
                if existing_item.get('subject') == 'All Subjects (Model & Revision Pools)' and not is_pool:
                    unique_items[existing_idx] = item
                    seen_hashes[f_hash] = (item, existing_idx)
                duplicates_dropped += 1
                continue
            seen_hashes[f_hash] = (item, len(unique_items))
        else:
            # Fallback by clean filename
            if fn_clean in seen_filenames:
                duplicates_dropped += 1
                continue
            seen_filenames[fn_clean] = True

        unique_items.append(item)

    print(f"De-duplication finished: Kept {len(unique_items)} unique items (Dropped {duplicates_dropped} duplicates)")

    # Step 2: Categorization & Pairing
    # subjects -> sections -> list of grouped cards
    grouped_by_subject = {k: defaultdict(list) for k in SUBJECT_DEFS}

    for item in unique_items:
        subj = detect_subject(item)
        file_title_l = clean_item_title(item.get('file_title', '')).lower()
        thread_title_l = item.get('thread_title', '').lower()
        full_text = (file_title_l + " " + thread_title_l)
        sec = detect_section(full_text)
        year = extract_year(item, full_text)
        term = detect_term(full_text)
        med = detect_medium(file_title_l) or detect_medium(full_text)
        is_key = detect_is_key(file_title_l, thread_title_l)
        title = clean_item_title(item.get('file_title', ''))
        
        # Target local relative path for Google Drive lookup
        # Format: downloaded_sslc_materials/<Subject>/<filename>
        rel_p = item.get('local_path', '').replace('\\', '/').strip('/')
        if not rel_p.startswith('downloaded_sslc_materials/'):
            rel_p = 'downloaded_sslc_materials/' + rel_p

        grouped_by_subject[subj][sec].append({
            'title': title,
            'year': year,
            'term': term,
            'medium': med,
            'is_key': is_key,
            'local_path': rel_p,
            'attachment_url': item.get('attachment_url', '')
        })

    # Step 3: Pair QPs and Keys within each section
    structured_subjects = []

    for subj_id, subj_cfg in SUBJECT_DEFS.items():
        sec_dict = grouped_by_subject[subj_id]
        subj_resources = {
            'board_annual_exams': [],
            'model_exams': [],
            'terminal_exams': [],
            'practice_revision_pools': []
        }

        for sec_name in ['board_annual_exams', 'model_exams', 'terminal_exams', 'practice_revision_pools']:
            items_in_sec = sec_dict[sec_name]
            
            if sec_name in ['board_annual_exams', 'model_exams', 'terminal_exams']:
                # Group by (year, term, medium)
                exam_groups = defaultdict(lambda: {'qps': [], 'keys': []})
                for it in items_in_sec:
                    y = it['year'] or 0
                    t = it['term'] or ''
                    m = it['medium'] or ''
                    # Grouping key
                    g_key = (y, t, m)
                    if it['is_key']:
                        exam_groups[g_key]['keys'].append(it)
                    else:
                        exam_groups[g_key]['qps'].append(it)

                # Convert exam_groups to structured exam cards
                # Sort by year descending (latest first)
                sorted_keys = sorted(exam_groups.keys(), key=lambda x: (x[0] or 0), reverse=True)

                for g_key in sorted_keys:
                    y, t, m = g_key
                    group = exam_groups[g_key]
                    qps = group['qps']
                    keys = group['keys']

                    # Default title
                    default_label = "Annual Board Exam" if sec_name == 'board_annual_exams' else "Model Exam" if sec_name == 'model_exams' else "Terminal Exam"
                    if t:
                        card_title = f"{t} Exam {y}" if y else f"{t} Exam"
                    elif y:
                        card_title = f"{y} {default_label}"
                    else:
                        card_title = f"{subj_cfg['name']} {default_label}"

                    if m:
                        card_title += f" ({m})"

                    card = {
                        'title': card_title,
                        'year': y if y > 0 else None,
                        'term': t if t else None,
                        'medium': m if m else None,
                        'question_papers': [{'title': q['title'], 'local_path': q['local_path']} for q in qps],
                        'answer_keys': [{'title': k['title'], 'local_path': k['local_path']} for k in keys]
                    }
                    subj_resources[sec_name].append(card)
            else:
                # Practice sets / Revision pools
                # Store as practice items sorted by year descending
                sorted_items = sorted(items_in_sec, key=lambda x: (x['year'] or 0), reverse=True)
                for it in sorted_items:
                    subj_resources[sec_name].append({
                        'title': it['title'],
                        'year': it['year'],
                        'medium': it['medium'],
                        'is_key': it['is_key'],
                        'local_path': it['local_path']
                    })

        structured_subjects.append({
            'subject_id': subj_id,
            'subject_name': subj_cfg['name'],
            'icon': subj_cfg['icon'],
            'html_file': subj_cfg['file'],
            'resources': subj_resources
        })

    result = {
        'board': 'Kerala State Board (SSLC)',
        'class': 'Class 10 (SSLC)',
        'subjects': structured_subjects
    }

    with open(OUTPUT_STRUCTURED, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    print(f"Structured data successfully saved to: {OUTPUT_STRUCTURED}")
    print("Summary of Cards Generated per Subject:")
    for s in structured_subjects:
        res = s['resources']
        print(f" - {s['subject_name']}: {len(res['board_annual_exams'])} Annual, {len(res['model_exams'])} Model, {len(res['terminal_exams'])} Terminal, {len(res['practice_revision_pools'])} Practice Sets")

if __name__ == '__main__':
    main()

