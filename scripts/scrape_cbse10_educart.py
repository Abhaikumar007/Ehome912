"""
CBSE Class 10 Previous Year Question Papers & Solutions Extractor
Source: Educart (https://www.educart.co/previous-year-question-paper/cbse-previous-year-question-papers-class-10)
Extracts all years (2026-2013), subjects, sets, question paper links, and solution links.
Outputs a structured JSON dataset.
"""

import urllib.request
from bs4 import BeautifulSoup
import re
import json
import time
import concurrent.futures
from datetime import datetime
import os

MAIN_URL = 'https://www.educart.co/previous-year-question-paper/cbse-previous-year-question-papers-class-10'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
}

def normalize_subject(name):
    clean = re.sub(r'\s+', ' ', name.strip()).lower()
    clean = clean.replace('&', 'and')
    
    if 'english' in clean:
        if 'comm' in clean:
            return 'english_communicative', 'English Communicative'
        else:
            return 'english_language_literature', 'English Language & Literature'
    if 'hindi' in clean:
        if 'b' in clean:
            return 'hindi_b', 'Hindi Course B'
        else:
            return 'hindi_a', 'Hindi Course A'
    if 'math' in clean:
        if 'basic' in clean:
            return 'maths_basic', 'Mathematics Basic'
        else:
            return 'maths_standard', 'Mathematics Standard'
    if 'social' in clean:
        return 'social_science', 'Social Science'
    if 'science' in clean:
        return 'science', 'Science'
    if 'sanskrit' in clean:
        return 'sanskrit', 'Sanskrit'
    if 'information' in clean or 'it' == clean:
        return 'information_technology', 'Information Technology'
    if 'computer' in clean:
        return 'computer_applications', 'Computer Applications'
        
    slug = re.sub(r'[^a-z0-9]+', '_', clean).strip('_')
    return slug, name.strip()

def fetch_html(url, retries=3):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode('utf-8', errors='ignore')
        except Exception as e:
            if attempt == retries - 1:
                print(f"[ERROR] Failed to fetch {url}: {e}")
                return None
            time.sleep(1 + attempt)
    return None

def parse_subject_page(url, year, subject_name):
    html = fetch_html(url)
    if not html:
        return []
        
    soup = BeautifulSoup(html, 'html.parser')
    sections = []
    seen_drive_links = set()
    
    tables = soup.find_all('table')
    for t_idx, table in enumerate(tables):
        t_drive = table.find_all('a', href=lambda h: h and 'drive.google.com' in h)
        if not t_drive:
            continue
            
        rows = table.find_all('tr')
        if not rows:
            continue
            
        # Determine section title
        header_row = rows[0]
        th_cells = [td.get_text(strip=True) for td in header_row.find_all(['th', 'td'])]
        first_header = th_cells[0] if th_cells else ''
        
        prev = table.find_previous(['h2', 'h3', 'h4', 'strong'])
        prev_heading = prev.get_text(strip=True) if prev else ''
        
        # Build intuitive section title
        section_title = 'Board Exam Papers'
        if any(kw in first_header.lower() for kw in ['supplementary', 'compartment', 'term', 'board exam', 'outside', 'delhi', 'foreign', 'nsqf']):
            section_title = first_header
        elif prev_heading and len(prev_heading) < 60 and not any(kw in prev_heading.lower() for kw in ['download', 'click', 'subscribe', 'book', 'sample']):
            section_title = prev_heading
        elif first_header and not any(kw in first_header.lower() for kw in ['cbse class 10', 'solutions', 'marking scheme']):
            section_title = first_header
            
        papers = []
        for r_idx, tr in enumerate(rows):
            tds = tr.find_all(['td', 'th'])
            if not tds:
                continue
                
            row_text = ' '.join(td.get_text(strip=True) for td in tds).lower()
            if r_idx == 0 and any(kw in row_text for kw in ['question paper', 'marking scheme', 'solutions', 'supplementary papers']):
                continue
                
            # Column 0: Question Paper
            qp_td = tds[0]
            qp_a = qp_td.find('a', href=lambda h: h and 'drive.google.com' in h)
            qp_title = qp_td.get_text(strip=True)
            qp_url = qp_a.get('href').strip() if qp_a else None
            if qp_url:
                seen_drive_links.add(qp_url)
                
            # Column 1+: Solutions
            solutions = []
            for sol_td in tds[1:]:
                for a in sol_td.find_all('a', href=lambda h: h and 'drive.google.com' in h):
                    s_href = a.get('href').strip()
                    s_label = a.get_text(strip=True) or 'Solution'
                    solutions.append({
                        'label': s_label,
                        'url': s_href
                    })
                    seen_drive_links.add(s_href)
                    
            if qp_url or solutions or qp_title:
                # Extract code, set, subset, region
                code_match = re.search(r'(\d+[-\w]+)', qp_title)
                code = code_match.group(1) if code_match else None
                
                set_match = re.search(r'set\s*(\d+|[a-zA-Z])', qp_title, re.IGNORECASE)
                set_num = f'Set {set_match.group(1)}' if set_match else None
                
                subset_match = re.search(r'subset\s*(\d+)', qp_title, re.IGNORECASE)
                subset_num = f'Subset {subset_match.group(1)}' if subset_match else None
                
                region = None
                for reg in ['Outside Delhi', 'Delhi', 'Foreign', 'NSQF', 'Term 1', 'Term 2', 'Compartment']:
                    if reg.lower() in qp_title.lower() or reg.lower() in section_title.lower():
                        region = reg
                        break
                        
                papers.append({
                    'id': f"cbse-10-{year}-{code or len(papers)+1}",
                    'title': qp_title,
                    'code': code,
                    'set': set_num,
                    'subset': subset_num,
                    'region_or_type': region,
                    'question_paper_url': qp_url,
                    'solutions': solutions
                })
                
        if papers:
            sections.append({
                'section_id': re.sub(r'[^a-z0-9]+', '-', section_title.lower()).strip('-') or f'section-{len(sections)+1}',
                'section_title': section_title,
                'papers_count': len(papers),
                'papers': papers
            })
            
    # Check any leftover drive links outside tables
    leftover_links = []
    for a in soup.find_all('a', href=lambda h: h and 'drive.google.com' in h):
        href = a.get('href').strip()
        if href not in seen_drive_links:
            seen_drive_links.add(href)
            leftover_links.append({
                'label': a.get_text(strip=True) or 'Additional Material',
                'url': href
            })
            
    if leftover_links:
        sections.append({
            'section_id': 'additional-resources',
            'section_title': 'Additional Drive Resources',
            'papers_count': len(leftover_links),
            'papers': [{
                'id': f"cbse-10-{year}-extra-{i+1}",
                'title': l['label'],
                'code': None,
                'set': None,
                'subset': None,
                'region_or_type': 'Extra Resource',
                'question_paper_url': l['url'],
                'solutions': []
            } for i, l in enumerate(leftover_links)]
        })
        
    return sections

def main():
    print("=" * 60)
    print("CBSE Class 10 Previous Year Question Papers & Solutions Extractor")
    print(f"Source: {MAIN_URL}")
    print("=" * 60)
    
    t0 = time.time()
    main_html = fetch_html(MAIN_URL)
    if not main_html:
        print("[FATAL] Could not load main page.")
        return
        
    soup = BeautifulSoup(main_html, 'html.parser')
    tables = soup.find_all('table')
    
    # Extract entries from Year tables (Tables 4 through end)
    crawl_queue = []
    direct_drive_entries = []
    
    for i in range(4, len(tables)):
        for tr in tables[i].find_all('tr'):
            tds = tr.find_all(['td', 'th'])
            if len(tds) >= 2:
                year_text = tds[0].get_text(strip=True)
                if any(char.isdigit() for char in year_text):
                    # Clean year to 4 digits
                    year_match = re.search(r'\b(20\d\d)\b', year_text)
                    year = year_match.group(1) if year_match else year_text
                    
                    for a in tds[1].find_all('a'):
                        raw_sub = a.get_text(strip=True)
                        href = a.get('href', '').strip()
                        sub_key, sub_display = normalize_subject(raw_sub)
                        
                        if 'drive.google.com' in href:
                            direct_drive_entries.append({
                                'year': year,
                                'subject_key': sub_key,
                                'subject_name': sub_display,
                                'raw_subject': raw_sub,
                                'drive_url': href
                            })
                        elif 'educart.co' in href:
                            crawl_queue.append({
                                'year': year,
                                'subject_key': sub_key,
                                'subject_name': sub_display,
                                'raw_subject': raw_sub,
                                'url': href
                            })
                            
    print(f"[INFO] Found {len(direct_drive_entries)} direct Google Drive subject folders.")
    print(f"[INFO] Found {len(crawl_queue)} Educart subject pages to crawl.")
    
    # Concurrent crawl of all subject pages
    print("[INFO] Starting concurrent crawl (10 workers)...")
    results = {}
    
    def worker(item):
        sections = parse_subject_page(item['url'], item['year'], item['subject_name'])
        return item, sections
        
    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_item = {executor.submit(worker, it): it for it in crawl_queue}
        for future in concurrent.futures.as_completed(future_to_item):
            item, sections = future.result()
            completed += 1
            if completed % 15 == 0 or completed == len(crawl_queue):
                print(f"  Progress: {completed}/{len(crawl_queue)} pages crawled...")
            results[(item['year'], item['subject_key'])] = {
                'item': item,
                'sections': sections
            }
            
    # Assemble comprehensive hierarchical structures
    # 1. by_year: Year -> Subject -> Sections -> Papers
    # 2. by_subject: Subject -> Year -> Sections -> Papers
    
    by_year = {}
    by_subject = {}
    
    total_qps = 0
    total_sols = 0
    
    # Process Direct Drive Entries first
    for d in direct_drive_entries:
        yr = d['year']
        s_key = d['subject_key']
        
        if yr not in by_year:
            by_year[yr] = {'year': yr, 'subjects': {}}
        if s_key not in by_subject:
            by_subject[s_key] = {
                'subject_key': s_key,
                'subject_name': d['subject_name'],
                'years': {}
            }
            
        entry = {
            'subject_key': s_key,
            'subject_name': d['subject_name'],
            'raw_subject': d['raw_subject'],
            'type': 'google_drive_folder',
            'drive_folder_url': d['drive_url'],
            'sections_count': 1,
            'papers_count': 1,
            'sections': [{
                'section_id': 'drive-folder',
                'section_title': 'Annual Board Exam Question Papers & Solutions Folder',
                'papers_count': 1,
                'papers': [{
                    'id': f"cbse-10-{yr}-{s_key}-folder",
                    'title': f"CBSE Class 10 {d['subject_name']} {yr} Complete Question Papers & Solutions Folder",
                    'code': None,
                    'set': None,
                    'subset': None,
                    'region_or_type': 'All Sets Folder',
                    'question_paper_url': d['drive_url'],
                    'solutions': [{'label': 'Folder with Papers & Marking Schemes', 'url': d['drive_url']}]
                }]
            }]
        }
        
        by_year[yr]['subjects'][s_key] = entry
        by_subject[s_key]['years'][yr] = entry
        total_qps += 1
        total_sols += 1
        
    # Process Scraped Pages
    for (yr, s_key), data in results.items():
        item = data['item']
        sections = data['sections']
        
        if yr not in by_year:
            by_year[yr] = {'year': yr, 'subjects': {}}
        if s_key not in by_subject:
            by_subject[s_key] = {
                'subject_key': s_key,
                'subject_name': item['subject_name'],
                'years': {}
            }
            
        sub_total_papers = sum(s['papers_count'] for s in sections)
        for s in sections:
            for p in s['papers']:
                if p['question_paper_url']:
                    total_qps += 1
                total_sols += len(p['solutions'])
                
        entry = {
            'subject_key': s_key,
            'subject_name': item['subject_name'],
            'raw_subject': item['raw_subject'],
            'type': 'individual_sets',
            'source_page_url': item['url'],
            'sections_count': len(sections),
            'papers_count': sub_total_papers,
            'sections': sections
        }
        
        by_year[yr]['subjects'][s_key] = entry
        by_subject[s_key]['years'][yr] = entry
        
    # Order years descending
    ordered_years = {yr: by_year[yr] for yr in sorted(by_year.keys(), key=lambda y: int(y) if y.isdigit() else 0, reverse=True)}
    ordered_subjects = {k: by_subject[k] for k in sorted(by_subject.keys())}
    
    # Calculate stats per subject
    for s_key, s_data in ordered_subjects.items():
        s_papers = 0
        s_sols = 0
        for yr, yr_data in s_data['years'].items():
            for sec in yr_data['sections']:
                for p in sec['papers']:
                    if p['question_paper_url']:
                        s_papers += 1
                    s_sols += len(p['solutions'])
        s_data['total_question_papers'] = s_papers
        s_data['total_solutions'] = s_sols
        s_data['available_years'] = sorted(list(s_data['years'].keys()), key=lambda y: int(y) if y.isdigit() else 0, reverse=True)
        
    output_data = {
        'board': 'CBSE',
        'class': 'Class 10',
        'title': 'CBSE Class 10 Previous Year Question Papers (PYQ) & Official Marking Scheme Solutions',
        'source': MAIN_URL,
        'extracted_at': datetime.now().isoformat(),
        'summary': {
            'total_years': len(ordered_years),
            'year_range': f"{min(ordered_years.keys())} - {max(ordered_years.keys())}",
            'total_subjects': len(ordered_subjects),
            'total_pages_crawled': len(crawl_queue),
            'total_direct_drive_folders': len(direct_drive_entries),
            'total_question_papers_extracted': total_qps,
            'total_solution_links_extracted': total_sols,
            'total_drive_resources': total_qps + total_sols
        },
        'by_year': ordered_years,
        'by_subject': ordered_subjects
    }
    
    # Output file paths
    dest1 = 'c:/Users/madhu/code_test/study-materials/cbse_class10_pyq_data.json'
    dest2 = 'c:/Users/madhu/eduhome/eduhome-app/constants/cbseClass10PyqData.json'
    
    os.makedirs(os.path.dirname(dest1), exist_ok=True)
    os.makedirs(os.path.dirname(dest2), exist_ok=True)
    
    with open(dest1, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    with open(dest2, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    file_size_mb = os.path.getsize(dest1) / (1024 * 1024)
    elapsed = round(time.time() - t0, 2)
    
    print("=" * 60)
    print("EXTRACTION COMPLETED SUCCESSFULLY!")
    print(f"Elapsed Time: {elapsed} seconds")
    print(f"Total Years: {len(ordered_years)} ({min(ordered_years.keys())} to {max(ordered_years.keys())})")
    print(f"Total Subjects: {len(ordered_subjects)}")
    print(f"Total Question Papers: {total_qps}")
    print(f"Total Solutions: {total_sols}")
    print(f"Total Google Drive Links: {total_qps + total_sols}")
    print(f"Saved to: {dest1} ({file_size_mb:.2f} MB)")
    print(f"Saved to: {dest2}")
    print("=" * 60)

if __name__ == '__main__':
    main()
