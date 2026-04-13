import os
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

html_content = """
<table style="height:607px;width:1154px"> 
   <thead> 
    <tr style="height:28px"> 
     <th style="height:28px;width:328px"> <p>Year</p> </th> 
     <th style="height:28px;width:486px"> <p>Download Question Paper PDF</p> </th> 
     <th style="height:28px;width:340px"> <p>Download Answer Key PDF</p> </th> 
    </tr> 
   </thead> 
   <tbody> 
    <tr> 
     <td style="width:328px"> <p>KEAM 2025 Question Papers</p> </td> 
     <td style="width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " title="23 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941103phpzewr5L.pdf" target="_blank" rel="noopener">23 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1745941157phpERgkJt.pdf" target="_blank" rel="noopener">24 April 2025 - Forenoon</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1745941180phpdGoMt3.pdf" target="_blank" rel="noopener">24 April 2025 - Afternoon</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1745941302phpmyOxpU.pdf" target="_blank" rel="noopener">25 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="26 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941316phpagw9zN.pdf" target="_blank" rel="noopener">26 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="27 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941239phpqzm2Hw.pdf" target="_blank" rel="noopener">27 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="28 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941289phpYERdIE.pdf" target="_blank" rel="noopener">28 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="29 April 2025 - Engineering" href="https://images.shiksha.com/mediadata/pdf/1745941412phpjngZtO.pdf" target="_blank" rel="noopener">29 April 2025 - Engineering</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="29 April 2025 - BPharm" href="https://images.shiksha.com/mediadata/pdf/1745941428phpyVfyqu.pdf" target="_blank" rel="noopener">29 April 2025 - BPharm</a></p> </td> 
     <td style="width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " title="23 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941103phpzewr5L.pdf" target="_blank" rel="noopener">23 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1745941157phpERgkJt.pdf" target="_blank" rel="noopener">24 April 2025 - Forenoon</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1745941180phpdGoMt3.pdf" target="_blank" rel="noopener">24 April 2025 - Afternoon</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1745941302phpmyOxpU.pdf" target="_blank" rel="noopener">25 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="26 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941316phpagw9zN.pdf" target="_blank" rel="noopener">26 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="27 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941239phpqzm2Hw.pdf" target="_blank" rel="noopener">27 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="28 April 2025" href="https://images.shiksha.com/mediadata/pdf/1745941289phpYERdIE.pdf" target="_blank" rel="noopener">28 April 2025</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="29 April 2025 - Engineering" href="https://images.shiksha.com/mediadata/pdf/1745941412phpjngZtO.pdf" target="_blank" rel="noopener">29 April 2025 - Engineering</a></p> <p><a class="smce-docs smce-ftype-ico pdf " title="29 April 2025 - BPharm" href="https://images.shiksha.com/mediadata/pdf/1745941428phpyVfyqu.pdf" target="_blank" rel="noopener">29 April 2025 - BPharm</a></p> </td> 
    </tr> 
    <tr> 
     <td style="width:328px"> <p>KEAM 2024 Question Papers</p> </td> 
     <td style="width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043145phpjL5HJv.pdf" target="_blank" rel="noopener">5 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043171phpqyUAnt.pdf" target="_blank" rel="noopener">6 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043191php4qlRmj.pdf" target="_blank" rel="noopener">7 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043216phpkomf1w.pdf" target="_blank" rel="noopener">8 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043235phpo2uObi.pdf" target="_blank" rel="noopener">9 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043280phpQ7CHL2.pdf" target="_blank" rel="noopener">10 June 2024 - BPharm</a></p> </td> 
     <td style="width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043145phpjL5HJv.pdf" target="_blank" rel="noopener">5 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043171phpqyUAnt.pdf" target="_blank" rel="noopener">6 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043191php4qlRmj.pdf" target="_blank" rel="noopener">7 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043216phpkomf1w.pdf" target="_blank" rel="noopener">8 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043235phpo2uObi.pdf" target="_blank" rel="noopener">9 June 2024</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1718043280phpQ7CHL2.pdf" target="_blank" rel="noopener">10 June 2024 - BPharm</a></p> </td> 
    </tr> 
    <tr style="height:57px"> 
     <td style="height:57px;width:328px"> <p>KEAM 2023 Question Paper</p> </td> 
     <td style="height:57px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314460phpiC2ZWa.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p>Download Paper 2*</p> </td> 
     <td style="height:57px;width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710315339phpferVoV.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710315427phphXjRJ7.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2022 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314492phpO3DNu9.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314506phpTryVmL.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
     <td style="height:58px;width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710315143phplyeEiD.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710315173phpJ0mBVU.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2021 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314780phpgXzZvI.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314799phpZL2fOw.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
     <td style="height:58px;width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656394190phpbd6wFO.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656394212phph2oKBc.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2020 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314734phpCJrX0n.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314748phpeKvv7X.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
     <td style="height:58px;width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656394133phpgd0uPp.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656394149phpLJID53.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2019 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314669phpKEiG0e.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314687phpNS6itz.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
     <td style="height:58px;width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656393925phpoufaTm.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656393903phps3yD3p.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2018 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314636phpBSsJaf.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314653phphfxRMX.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
     <td style="height:58px;width:340px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656394308phpiJOr5Q.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1656394308phpiJOr5Q.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2017 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314610phpNyPy3M.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314621phpQ84jyq.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2016 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314587phpMnWTIP.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314598phpr3AQzV.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2015 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314548phpxOHttv.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314570phpOBWPqr.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
    <tr style="height:58px"> 
     <td style="height:58px;width:328px"> <p>KEAM 2014 Question Paper</p> </td> 
     <td style="height:58px;width:486px"> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314524phpZqYinK.pdf" target="_blank" rel="noopener">Download Paper 1</a></p> <p><a class="smce-docs smce-ftype-ico pdf " href="https://images.shiksha.com/mediadata/pdf/1710314537phpjUzmI2.pdf" target="_blank" rel="noopener">Download Paper 2</a></p> </td> 
    </tr> 
   </tbody> 
  </table>
"""

output_dir = "keam previous year question papers"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

download_dir = os.path.abspath(output_dir)

soup = BeautifulSoup(html_content, 'html.parser')
links = soup.find_all('a')
downloaded = set()

valid_links = []
for link in links:
    href = link.get('href')
    if href and href.startswith('http') and href.endswith('.pdf') and href not in downloaded:
        valid_links.append(href)
        downloaded.add(href)

options = Options()
options.add_experimental_option("prefs", {
    "download.default_directory": download_dir,
    "download.prompt_for_download": False,
    "plugins.always_open_pdf_externally": True  # Forces download instead of opening
})

print("Starting Chrome driver...")
driver = webdriver.Chrome(options=options)

for href in valid_links:
    print(f"Downloading {href}...")
    try:
        driver.get(href)
        time.sleep(3) # Wait a bit for the download to trigger and complete
    except Exception as e:
        print(f"Error for {href}: {e}")

print("Giving extra time for final downloads to complete...")
time.sleep(10)

driver.quit()
print(f"Done! Check the '{output_dir}' folder.")
