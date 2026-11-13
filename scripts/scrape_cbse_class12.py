import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAIN_URL = "https://www.educart.co/previous-year-question-paper/cbse-previous-year-question-papers-class-12"
OUTPUT_JSON = os.path.join(BASE_DIR, "study-materials", "cbse_class12_pyq_data.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

SUBJECT_META = {
    "english_core": {"subject_name": "English Core", "raw_subject": "English Core"},
    "mathematics": {"subject_name": "Mathematics", "raw_subject": "Mathematics"},
    "applied_mathematics": {"subject_name": "Applied Mathematics", "raw_subject": "Applied Mathematics"},
    "physics": {"subject_name": "Physics", "raw_subject": "Physics"},
    "chemistry": {"subject_name": "Chemistry", "raw_subject": "Chemistry"},
    "biology": {"subject_name": "Biology", "raw_subject": "Biology"},
    "accountancy": {"subject_name": "Accountancy", "raw_subject": "Accountancy"},
    "business_studies": {"subject_name": "Business Studies", "raw_subject": "Business Studies"},
    "economics": {"subject_name": "Economics", "raw_subject": "Economics"},
    "hindi_core": {"subject_name": "Hindi Core", "raw_subject": "Hindi Core"},
    "psychology": {"subject_name": "Psychology", "raw_subject": "Psychology"},
    "physical_education": {"subject_name": "Physical Education", "raw_subject": "Physical Education"},
    "history": {"subject_name": "History", "raw_subject": "History"},
    "geography": {"subject_name": "Geography", "raw_subject": "Geography"},
    "political_science": {"subject_name": "Political Science", "raw_subject": "Pol. Science"},
}


def normalize_url(href):
    if not href:
        return None
    href = href.strip()
    if href.startswith("http://educart.co"):
        href = href.replace("http://educart.co", "https://www.educart.co", 1)
    elif href.startswith("http://www.educart.co"):
        href = href.replace("http://www.educart.co", "https://www.educart.co", 1)
    elif href.startswith("/"):
        href = urljoin("https://www.educart.co", href)
    return href.rstrip("/")


def map_subject_key(label, url):
    low = (label + " " + url).lower()
    if "applied-math" in low or "applied math" in low:
        return "applied_mathematics"
    if "english" in low:
        return "english_core"
    if "math" in low:
        return "mathematics"
    if "physics" in low:
        return "physics"
    if "chemistry" in low:
        return "chemistry"
    if "biology" in low:
        return "biology"
    if "account" in low:
        return "accountancy"
    if "business" in low:
        return "business_studies"
    if "economics" in low:
        return "economics"
    if "hindi" in low:
        return "hindi_core"
    if "psychology" in low:
        return "psychology"
    if "physical-education" in low or "physical education" in low:
        return "physical_education"
    if "history" in low:
        return "history"
    if "geography" in low:
        return "geography"
    if "political" in low or "pol. science" in low or "pol science" in low:
        return "political_science"
    return None


def discover_subject_year_pages():
    r = requests.get(MAIN_URL, headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    discovered = {}  # (subj_key, year) -> url

    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if not rows:
            continue
        header_cells = [c.get_text(strip=True).lower() for c in rows[0].find_all(["th", "td"])]
        if len(header_cells) < 2:
            continue

        is_subj_first = "subject" in header_cells[0]
        is_year_first = "year" in header_cells[0]

        for tr in rows[1:]:
            tds = tr.find_all(["th", "td"])
            if len(tds) < 2:
                continue
            col0 = tds[0].get_text(strip=True)
            links = tds[1].find_all("a", href=True)

            if is_subj_first:
                for a in links:
                    yr_txt = a.get_text(strip=True).strip(", ")
                    m_yr = re.search(r"(20\d{2})", yr_txt)
                    if not m_yr:
                        continue
                    year = m_yr.group(1)
                    url = normalize_url(a["href"])
                    # Fix known educart typo where History 2020 links to 2022 or Physical Ed 2022
                    skey = map_subject_key(col0, url)
                    if skey:
                        # Prefer URL year if URL explicitly ends with -YYYY and matches
                        m_url_yr = re.search(r"-(20\d{2})$", url)
                        if m_url_yr and m_url_yr.group(1) != year and skey in url:
                            year = m_url_yr.group(1)
                        discovered.setdefault((skey, year), url)
            elif is_year_first:
                m_yr = re.search(r"(20\d{2})", col0)
                if not m_yr:
                    continue
                year = m_yr.group(1)
                is_sol_row = "solution" in col0.lower()
                is_paper_row = "paper" in col0.lower()
                for a in links:
                    subj_txt = a.get_text(strip=True).strip(", ")
                    url = normalize_url(a["href"])
                    skey = map_subject_key(subj_txt, url)
                    if skey:
                        if "drive.google.com" in url:
                            key = (skey, f"{year}_drive_{'sol' if is_sol_row else 'qp'}")
                            discovered.setdefault(key, url)
                        else:
                            discovered.setdefault((skey, year), url)

    return discovered


def parse_paper_metadata(title_text):
    code = None
    m_code = re.search(r"\b(\d{1,3}[-/][A-Za-z0-9]+(?:[-/]\d+)?)\b", title_text)
    if m_code:
        code = m_code.group(1)

    set_val = None
    m_set = re.search(r"\bSet\s*[-:]?\s*([A-Za-z0-9]+)\b", title_text, re.IGNORECASE)
    if m_set:
        set_val = f"Set {m_set.group(1).upper()}"

    subset_val = None
    m_sub = re.search(r"\bSubset\s*[-:]?\s*([A-Za-z0-9]+)\b", title_text, re.IGNORECASE)
    if m_sub:
        subset_val = f"Subset {m_sub.group(1).upper()}"

    region = None
    low = title_text.lower()
    if "outside delhi" in low:
        region = "Outside Delhi"
    elif "delhi" in low:
        region = "Delhi"
    elif "foreign" in low:
        region = "Foreign"
    elif "compartment" in low or "supp" in low:
        region = "Compartment"
    elif "all india" in low:
        region = "All India"

    return code, set_val, subset_val, region


def scrape_subject_year_page(skey, year, url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            return skey, year, None, f"HTTP {r.status_code}"
    except Exception as e:
        return skey, year, None, str(e)

    soup = BeautifulSoup(r.text, "html.parser")
    sections = []
    seen_qp_urls = set()

    for t_idx, table in enumerate(soup.find_all("table")):
        rows = table.find_all("tr")
        if not rows:
            continue

        # Check if this table actually has drive.google.com links
        table_drive_links = [
            a["href"] for a in table.find_all("a", href=True) if "drive.google.com" in a["href"]
        ]
        if not table_drive_links:
            continue

        header_cells = [c.get_text(" ", strip=True) for c in rows[0].find_all(["th", "td"])]
        sec_title = header_cells[0] if header_cells else f"CBSE Class 12 {SUBJECT_META[skey]['subject_name']} {year}"
        sec_id = re.sub(r"[^a-z0-9]+", "-", sec_title.lower()).strip("-") or f"section-{t_idx}"

        # Detect if there is a heading immediately preceding the table indicating Supplementary/Compartment
        prev_h = table.find_previous(["h2", "h3", "h4"])
        if prev_h:
            prev_txt = prev_h.get_text(" ", strip=True)
            if any(k in prev_txt.lower() for k in ["compartment", "supplementary", "term 1", "term 2"]):
                sec_title = prev_txt
                sec_id = re.sub(r"[^a-z0-9]+", "-", sec_title.lower()).strip("-")

        papers = []
        for r_idx, tr in enumerate(rows[1:]):
            tds = tr.find_all(["th", "td"])
            if not tds:
                continue

            row_drive_links = []
            for c_idx, td in enumerate(tds):
                col_links = [a for a in td.find_all("a", href=True) if "drive.google.com" in a["href"]]
                row_drive_links.append((td.get_text(" ", strip=True), col_links))

            if not any(links for _, links in row_drive_links):
                continue

            # Column 0 is usually Question Paper (with title + drive link), Column 1+ are Solutions
            col0_text, col0_links = row_drive_links[0]
            qp_url = col0_links[0]["href"].strip() if col0_links else None

            solutions = []
            # If col0 had multiple links (rare)
            for extra_a in col0_links[1:]:
                solutions.append({
                    "label": extra_a.get_text(" ", strip=True) or "Solution",
                    "url": extra_a["href"].strip(),
                })

            for sol_text, sol_links in row_drive_links[1:]:
                for a in sol_links:
                    lbl = a.get_text(" ", strip=True) or sol_text or "Solution"
                    if lbl.lower() in ["download", "click here", "view", "link", "pdf"]:
                        lbl = "Solution"
                    solutions.append({
                        "label": lbl,
                        "url": a["href"].strip(),
                    })

            # If qp_url is missing but solutions exist (e.g. 2021 solution-only rows), still include
            dedup_key = qp_url or (solutions[0]["url"] if solutions else col0_text)
            if dedup_key in seen_qp_urls:
                continue
            seen_qp_urls.add(dedup_key)

            title = col0_text or f"{SUBJECT_META[skey]['subject_name']} {year} Paper {r_idx + 1}"
            code, set_val, subset_val, region = parse_paper_metadata(title)

            papers.append({
                "id": f"cbse-12-{year}-{skey}-{t_idx}-{r_idx + 1}",
                "title": title,
                "code": code,
                "set": set_val,
                "subset": subset_val,
                "region_or_type": region,
                "question_paper_url": qp_url,
                "solutions": solutions,
            })

        if papers:
            sections.append({
                "section_id": sec_id,
                "section_title": sec_title,
                "papers_count": len(papers),
                "papers": papers,
            })

    # Fallback: check for direct Google Drive folder links if no table papers found
    drive_folders = [
        a["href"].strip()
        for a in soup.find_all("a", href=True)
        if "drive.google.com/drive" in a["href"] and "/folders/" in a["href"]
    ]
    if not sections and drive_folders:
        f_url = drive_folders[0]
        sections.append({
            "section_id": "drive-folder",
            "section_title": "Annual Board Exam Question Papers & Solutions Folder",
            "papers_count": 1,
            "papers": [{
                "id": f"cbse-12-{year}-{skey}-folder",
                "title": f"CBSE Class 12 {SUBJECT_META[skey]['subject_name']} {year} Complete Question Papers & Solutions Folder",
                "code": None,
                "set": None,
                "subset": None,
                "region_or_type": "All Sets Folder",
                "question_paper_url": f_url,
                "solutions": [{"label": "Folder with Papers & Marking Schemes", "url": f_url}],
            }],
        })
        entry_type = "google_drive_folder"
    else:
        entry_type = "individual_sets"

    if not sections:
        return skey, year, None, "No Drive links found"

    total_papers = sum(s["papers_count"] for s in sections)
    meta = SUBJECT_META[skey]
    subject_obj = {
        "subject_key": skey,
        "subject_name": meta["subject_name"],
        "raw_subject": meta["raw_subject"],
        "type": entry_type,
        "source_page_url": url,
        "sections_count": len(sections),
        "papers_count": total_papers,
        "sections": sections,
    }
    if entry_type == "google_drive_folder":
        subject_obj["drive_folder_url"] = drive_folders[0]

    return skey, year, subject_obj, None


def main():
    print("Discovering CBSE Class 12 subject-year pages from Educart...")
    discovered = discover_subject_year_pages()
    print(f"Discovered {len(discovered)} subject-year pages.")

    by_year = {}
    errors = []

    html_pages = {}
    direct_drive = {}  # (skey, year) -> {'qp': url, 'sol': url}
    for (skey, yr_key), url in discovered.items():
        if "_drive_" in yr_key:
            real_yr, kind = yr_key.split("_drive_")
            direct_drive.setdefault((skey, real_yr), {})[kind] = url
        else:
            html_pages[(skey, yr_key)] = url

    for (skey, yr), urls in direct_drive.items():
        meta = SUBJECT_META[skey]
        qp_u = urls.get("qp")
        sol_u = urls.get("sol")
        sols = [{"label": "Solution", "url": sol_u}] if sol_u else []
        by_year.setdefault(yr, {"year": yr, "subjects": {}})
        by_year[yr]["subjects"][skey] = {
            "subject_key": skey,
            "subject_name": meta["subject_name"],
            "raw_subject": meta["raw_subject"],
            "type": "individual_sets",
            "source_page_url": MAIN_URL,
            "sections_count": 1,
            "papers_count": 1,
            "sections": [{
                "section_id": f"cbse-class-12-{skey}-{yr}",
                "section_title": f"CBSE Class 12 {meta['subject_name']} Sample / Board Paper {yr}",
                "papers_count": 1,
                "papers": [{
                    "id": f"cbse-12-{yr}-{skey}-direct",
                    "title": f"CBSE Class 12 {meta['subject_name']} {yr}",
                    "code": None,
                    "set": None,
                    "subset": None,
                    "region_or_type": "Official Paper & Solution" if (qp_u and sol_u) else ("Solution Only" if sol_u else "Paper"),
                    "question_paper_url": qp_u,
                    "solutions": sols,
                }],
            }],
        }

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(scrape_subject_year_page, skey, year, url)
            for (skey, year), url in sorted(html_pages.items())
        ]
        for fut in as_completed(futures):
            skey, year, subj_obj, err = fut.result()
            if subj_obj:
                by_year.setdefault(year, {"year": year, "subjects": {}})
                by_year[year]["subjects"][skey] = subj_obj
            else:
                errors.append((skey, year, html_pages[(skey, year)], err))

    # Sort years descending
    sorted_by_year = {y: by_year[y] for y in sorted(by_year.keys(), reverse=True)}

    total_qps = 0
    total_sols = 0
    total_folders = 0
    unique_subjects = set()
    for y, ydata in sorted_by_year.items():
        for sk, sv in ydata["subjects"].items():
            unique_subjects.add(sk)
            if sv.get("type") == "google_drive_folder":
                total_folders += 1
            for sec in sv.get("sections", []):
                for p in sec.get("papers", []):
                    if p.get("question_paper_url"):
                        total_qps += 1
                    total_sols += len(p.get("solutions", []))

    years_list = sorted(sorted_by_year.keys())
    year_range = f"{years_list[0]} - {years_list[-1]}" if years_list else ""

    output = {
        "board": "CBSE",
        "class": "Class 12",
        "title": "CBSE Class 12 Previous Year Question Papers (PYQ) & Official Marking Scheme Solutions",
        "source": MAIN_URL,
        "extracted_at": datetime.now().isoformat(),
        "summary": {
            "total_years": len(years_list),
            "year_range": year_range,
            "total_subjects": len(unique_subjects),
            "total_pages_crawled": len(discovered),
            "total_direct_drive_folders": total_folders,
            "total_question_papers_extracted": total_qps,
            "total_solution_links_extracted": total_sols,
            "total_drive_resources": total_qps + total_sols,
        },
        "by_year": sorted_by_year,
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nSaved CBSE Class 12 data to: {OUTPUT_JSON}")
    print("Summary:", json.dumps(output["summary"], indent=2))
    if errors:
        print(f"\nWarnings ({len(errors)} pages had no Drive links or failed):")
        for sk, yr, u, e in errors:
            print(f"  - {sk} {yr}: {e} ({u})")


if __name__ == "__main__":
    main()
