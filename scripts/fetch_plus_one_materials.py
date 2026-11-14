import json
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import parse_qs, urljoin, urlparse

import bs4
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREADS_JSON = os.path.join(BASE_DIR, "study-materials", "plus_one_threads.json")
STRUCTURED_JSON = os.path.join(BASE_DIR, "study-materials", "plus_one_structured_data.json")
DOWNLOAD_ROOT = r"C:\Users\madhu\Downloads\downloaded_plus_one_materials"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

SUBJECT_FOLDER_MAP = {
    "Mathematics": "Mathematics",
    "Physics": "Physics",
    "Chemistry": "Chemistry",
    "Biology": "Biology",
    "Computer Science / App": "Computer Science App",
    "Commerce (Accountancy/Business)": "Commerce (AccountancyBusiness)",
    "Humanities (History/Geog/Econ)": "Humanities (HistoryGeogEcon)",
    "Social Science": "Social Science",
    "English": "English",
    "Malayalam I": "Malayalam I",
    "Hindi": "Hindi",
    "Arabic": "Arabic",
    "All Subjects (Model & Revision Pools)": "All Subjects (Model & Revision Pools)",
    "Other Subjects (Statistics, Urdu, Sanskrit, French, Electronics, Geology, Home Science)": "Other Subjects",
}

_thread_local = threading.local()


def get_session():
    if not hasattr(_thread_local, "session"):
        s = requests.Session()
        s.headers.update(HEADERS)
        _thread_local.session = s
    return _thread_local.session


def sanitize_filename(name):
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "-", name)
    name = re.sub(r"\s+", " ", name).strip().rstrip(".")
    if len(name) > 160:
        stem, ext = os.path.splitext(name)
        name = stem[: 160 - len(ext)].rstrip() + ext
    return name or "attachment.pdf"


def extract_aid(href):
    parsed = urlparse(href)
    qs = parse_qs(parsed.query)
    aids = qs.get("aid")
    if aids:
        return aids[0]
    m = re.search(r"aid=(\d+)", href)
    return m.group(1) if m else None


def scrape_thread(subject, thread):
    url = thread["url"]
    session = get_session()
    try:
        resp = session.get(url, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        return subject, thread, [], f"HTTP error: {e}"

    soup = bs4.BeautifulSoup(resp.text, "html.parser")
    attachments = []
    seen_aids = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "attachment.php" not in href:
            continue
        aid = extract_aid(href)
        if not aid or aid in seen_aids:
            continue
        seen_aids.add(aid)
        full_url = urljoin("https://www.educationobserver.com/forum/", href)
        raw_name = a.get_text(strip=True) or f"attachment_{aid}.pdf"
        attachments.append(
            {
                "aid": aid,
                "name": raw_name,
                "url": full_url,
            }
        )
    return subject, thread, attachments, None


def download_attachment(item):
    aid = item["aid"]
    url = item["url"]
    dest_path = item["local_path"]
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 512:
        return aid, dest_path, "skipped"

    session = get_session()
    try:
        with session.get(url, stream=True, timeout=40) as resp:
            resp.raise_for_status()
            ctype = resp.headers.get("Content-Type", "").lower()
            if "text/html" in ctype:
                return aid, dest_path, f"html_response ({ctype})"
            tmp_path = dest_path + ".part"
            with open(tmp_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=65536):
                    if chunk:
                        f.write(chunk)
            if os.path.getsize(tmp_path) < 100:
                os.remove(tmp_path)
                return aid, dest_path, "empty_file"
            os.replace(tmp_path, dest_path)
            return aid, dest_path, "downloaded"
    except Exception as e:
        return aid, dest_path, f"error: {e}"


def main():
    with open(THREADS_JSON, "r", encoding="utf-8") as f:
        threads_by_subject = json.load(f)

    tasks = []
    for subj, thread_list in threads_by_subject.items():
        for idx, t in enumerate(thread_list):
            tasks.append((subj, idx, t))

    print(f"Scraping {len(tasks)} threads across {len(threads_by_subject)} subjects...")
    results_map = {}
    errors = []

    with ThreadPoolExecutor(max_workers=12) as pool:
        future_map = {
            pool.submit(scrape_thread, subj, t): (subj, idx)
            for subj, idx, t in tasks
        }
        done_count = 0
        for fut in as_completed(future_map):
            subj, idx = future_map[fut]
            _, thread, atts, err = fut.result()
            results_map[(subj, idx)] = (thread, atts)
            if err:
                errors.append((subj, thread["url"], err))
            done_count += 1
            if done_count % 50 == 0 or done_count == len(tasks):
                print(f"  Scraped {done_count}/{len(tasks)} threads...")

    # Assign unique local paths and deduplicate downloads by (folder, aid)
    used_paths = set()
    aid_to_rel = {}
    download_queue = []
    structured = {}

    for subj, thread_list in threads_by_subject.items():
        folder = SUBJECT_FOLDER_MAP.get(subj, sanitize_filename(subj))
        structured[subj] = []
        for idx in range(len(thread_list)):
            thread, atts = results_map[(subj, idx)]
            out_atts = []
            for att in atts:
                aid = att["aid"]
                if aid in aid_to_rel:
                    rel_path = aid_to_rel[aid]
                else:
                    clean_name = sanitize_filename(att["name"])
                    rel_path = f"{folder}/{clean_name}"
                    if rel_path.lower() in used_paths:
                        stem, ext = os.path.splitext(clean_name)
                        clean_name = f"{stem}_{aid}{ext}"
                        rel_path = f"{folder}/{clean_name}"
                    used_paths.add(rel_path.lower())
                    aid_to_rel[aid] = rel_path
                    download_queue.append(
                        {
                            "aid": aid,
                            "url": att["url"],
                            "rel_path": rel_path,
                            "local_path": os.path.join(
                                DOWNLOAD_ROOT, rel_path.replace("/", os.sep)
                            ),
                        }
                    )
                out_atts.append(
                    {
                        "aid": aid,
                        "name": att["name"],
                        "source_url": att["url"],
                        "rel_path": rel_path,
                    }
                )
            structured[subj].append(
                {
                    "year": thread.get("year", ""),
                    "title": thread.get("title", ""),
                    "url": thread.get("url", ""),
                    "attachments": out_atts,
                }
            )

    with open(STRUCTURED_JSON, "w", encoding="utf-8") as f:
        json.dump(structured, f, indent=2, ensure_ascii=False)

    print(
        f"Scrape complete. Unique attachments to download: {len(download_queue)} "
        f"(thread errors: {len(errors)})."
    )
    if errors:
        for e in errors[:10]:
            print("  Thread error:", e)

    # Download concurrently
    downloaded = 0
    skipped = 0
    failed = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(download_attachment, item) for item in download_queue]
        total = len(futures)
        for i, fut in enumerate(as_completed(futures), 1):
            aid, path, status = fut.result()
            if status == "downloaded":
                downloaded += 1
            elif status == "skipped":
                skipped += 1
            else:
                failed.append((aid, path, status))
            if i % 100 == 0 or i == total:
                print(
                    f"  Download progress: {i}/{total} "
                    f"(new: {downloaded}, skipped: {skipped}, failed: {len(failed)})"
                )

    print(
        f"Download finished! New: {downloaded}, Skipped: {skipped}, Failed: {len(failed)}"
    )
    if failed:
        for f_item in failed[:15]:
            print("  Failed:", f_item)


if __name__ == "__main__":
    main()

