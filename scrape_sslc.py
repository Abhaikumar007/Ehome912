import urllib.request
import re
from bs4 import BeautifulSoup
import json
import os

base_url = 'https://www.educationobserver.com'
topic_url = 'https://www.educationobserver.com/kerala-sslc-exam-model-previous-papers/'

print("Fetching main page...")
req = urllib.request.Request(topic_url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
soup = BeautifulSoup(html, 'html.parser')

threads = []
article_links = set()

for a in soup.find_all('a', href=True):
    href = a['href']
    if 'showthread.php?tid=' in href:
        threads.append((href, a.text.strip()))
    elif '2025' in href or '2026' in href:
        # It's an article link that might contain more threads
        if href.startswith('http'):
            article_links.add(href)
        elif href.startswith('/'):
            article_links.add(base_url + href)

print(f"Found {len(article_links)} potential article links for 2025/2026.")
for i, article_url in enumerate(list(article_links)):
    print(f"Checking article {i+1}/{len(article_links)}: {article_url}")
    try:
        req = urllib.request.Request(article_url, headers={'User-Agent': 'Mozilla/5.0'})
        ahtml = urllib.request.urlopen(req).read().decode('utf-8')
        asoup = BeautifulSoup(ahtml, 'html.parser')
        
        # Look for threads inside the article
        for a in asoup.find_all('a', href=True):
            href = a['href']
            if 'showthread.php?tid=' in href:
                title = a.text.strip()
                if not title:
                    # In articles, the link text might be empty if it's wrapping an image or just says "Click Here"
                    # Try to get surrounding text or just use a generic title
                    title = f"Paper from {article_url.split('/')[-2] if article_url.endswith('/') else article_url.split('/')[-1]}"
                
                # Cleanup the href to standardized format
                if not href.startswith('http'):
                    href = base_url + '/forum/' + href if not href.startswith('/') else base_url + href
                    
                threads.append((href, title))
    except Exception as e:
        print(f"Error checking article {article_url}: {e}")

# Dedup threads
seen = set()
unique_threads = []
for href, title in threads:
    if href not in seen and title:
        seen.add(href)
        unique_threads.append((href, title))

print(f"Found {len(unique_threads)} unique threads.")

results = []
for i, (href, title) in enumerate(unique_threads):
    if not href.startswith('http'):
        href = base_url + '/forum/' + href if not href.startswith('/') else base_url + href
    
    print(f"Processing thread {i+1}/{len(unique_threads)}: {title}")
    try:
        req = urllib.request.Request(href, headers={'User-Agent': 'Mozilla/5.0'})
        thtml = urllib.request.urlopen(req).read().decode('utf-8')
        tsoup = BeautifulSoup(thtml, 'html.parser')
        
        # If title is just "Download" or empty, grab it from the thread page itself
        if title.lower() in ('download', 'd', ''):
            title_tag = tsoup.find('title')
            if title_tag:
                title = title_tag.text.strip()
                # Remove common forum suffixes like " - Education Observer Forum"
                title = re.sub(r' - Education Observer.*$', '', title).strip()
                
        # Look for attachments
        attachments = []
        for a in tsoup.find_all('a', href=True):
            ahref = a['href']
            if 'attachment.php?aid=' in ahref:
                full_ahref = base_url + '/forum/' + ahref if not ahref.startswith('http') else ahref
                attachments.append({
                    'name': a.text.strip() or "Download Attachment",
                    'url': full_ahref
                })
        
        if attachments:
            results.append({
                'thread_title': title,
                'thread_url': href,
                'attachments': attachments
            })
    except Exception as e:
        print(f"Error on {href}: {e}")

with open('c:\\Users\\madhu\\code_test\\scraped_sslc.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("Scraping complete!")
