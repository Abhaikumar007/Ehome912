import json
import os

RAW_PATH = r"c:\Users\madhu\code_test\study-materials\sslc_raw_lsjson.json"
MAP_PATH = r"c:\Users\madhu\code_test\study-materials\gdrive_sslc_files_map.json"

def main():
    if not os.path.exists(RAW_PATH):
        print("Raw lsjson not found.")
        return
    try:
        with open(RAW_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        with open(RAW_PATH, 'r', encoding='utf-16') as f:
            data = json.load(f)

    file_map = {}
    for item in data:
        if item.get('IsDir'):
            continue
        path = item.get('Path', '')
        file_id = item.get('ID', '')
        if path and file_id:
            norm_path = path.replace('\\', '/').strip('/')
            full_rel = 'downloaded_sslc_materials/' + norm_path
            link = f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"
            file_map[full_rel] = link
            file_map[norm_path] = link

    with open(MAP_PATH, 'w', encoding='utf-8') as f:
        json.dump(file_map, f, indent=2)

    print(f"Generated {len(file_map)} mapping entries in {MAP_PATH}")

if __name__ == '__main__':
    main()
