/**
 * EduHome Class 12 (Plus Two) Previous Year Question Papers & Answer Keys (PYQ)
 * Auto-compiled from DHSE Kerala State Higher Secondary Education curriculum.
 * Over 490+ curated Google Drive links for Physics, Chemistry, Maths, Biology, etc.
 */

export interface PyqLink {
  type: 'qp' | 'key' | 'other';
  label: string;
  url: string;
}

export interface PyqCard {
  id: string;
  year: string;
  title: string;
  sectionId: string;
  links: PyqLink[];
}

export interface PyqPracticeSet {
  label: string;
  url: string;
}

export interface PyqSection {
  id: string;
  title: string;
  cardsCount: number;
  practiceSetsCount: number;
  cards: PyqCard[];
  practiceSets: PyqPracticeSet[];
}

export interface PyqSubject {
  subjectKey: string;
  subjectName: string;
  icon: string;
  color: string;
  bg: string;
  sections: PyqSection[];
}

export const CLASS_12_PYQ_DATA: Record<string, PyqSubject> = {
  "arabic": {
    "subjectKey": "arabic",
    "subjectName": "Arabic",
    "icon": "moon",
    "color": "#4F46E5",
    "bg": "#EEF2FF",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "arabic-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1shUh_9cbhZV6dqsDkhuD-of99Oyd4iSv/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1M_8_mSc0hdc9x2vSQ08qc-NaAwHEw-Br/view?usp=sharing"
              }
            ]
          },
          {
            "id": "arabic-board-exams-2024-1",
            "year": "2024",
            "title": "2024 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1uY_kBrmatm1wrErkTo3n36T4EiIndXR8/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1ZuRHDEWevyymv8jeomIgdRkOaFQQKYnV/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 1,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "arabic-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1yH6EW4Fess-5Yat_oQ6-7ytdVJ5Ze43f/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "arabic-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1ihhr-sNdc6LAmFH3Q-dPqaz_4KjBPodh/view?usp=sharing"
              }
            ]
          },
          {
            "id": "arabic-terminal-exams-2024-1",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1_EN4xfG63iyXcvAqvkrXUNQara2qdQKD/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "biology": {
    "subjectKey": "biology",
    "subjectName": "Biology",
    "icon": "fitness",
    "color": "#16A34A",
    "bg": "#F0FDF4",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 10,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "biology-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1C-bI8vTElR54DxTMhCnriNkAWK9tzBna/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/15zcqDw--r9wnIPQq02cIMzaXsU7Ua6B9/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1pEl3lSa2zyCga2001URbuHQlu-Ojnrmg/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/16joZIKUsXJcS0Mu9b0lzYALBl9YspS8n/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1zcYJd3ktrwtU2bTY63vOYbUW-D-lL-O9/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/14oT7Xb0Ej1WEnONbP4G81hzmYhrBuHc4/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2025-1",
            "year": "2025",
            "title": "2025 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1MZkC0Qnr4qNFCNXLWIHKkpXEkTpUEt6P/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1G95LWeogwdNX-BtBMMEBT0-Ex7soYA79/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1IyGHsSyDUW3d-2UJzK9sTemhnciWQ6ti/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1SehjJ9wlsQccfNCB9XPv1w4bDFUadLQb/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1oHFGksXyowxxyVTA42OpQqHhfZoSJ51F/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Navas Sir)",
                "url": "https://drive.google.com/file/d/1QEKUdZSRCFAQ90AzYbf1GzA0_XXoqXcV/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2024-2",
            "year": "2024",
            "title": "2024 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1yRq9vT1dNlWTG3R_32XM8O-McXTtdNzK/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2023-3",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/104VLJjd66kvHKjBLEl4OXYXJKh9xkIaF/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1BBgwXaAXXRqmRhlFC06_Bl6SqQtcUJ_l/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1AXBn2hBxKCBQeAt417QVNMAFFdmVwuRE/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1JPIwTnvCgruDkrgRB3pCpaexGTvFyrJf/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1p2JRbTSqAyT4i-yd3Er8fbSG_kXx-Z7d/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1O2UlMsLKcGedgBC1GdwtizT0aLu66KNL/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2022-4",
            "year": "2022",
            "title": "2022 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1V7m7cjJfMB64F26TMyx-cS0P0qQIpdxf/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1ARxoUQzr5K_zHivH1eeXpWI8Ew62ozfv/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1iOga3J1S3HnzW1AwwU4DCD9S3UFEEtyp/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1OzKvKqyvTWDbA1GBMKeNi7oC3FiFuVt1/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2021-5",
            "year": "2021",
            "title": "2021 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1n8JhfvhLxXzfzgNhs10WTbeH4pJVkF6D/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2019-6",
            "year": "2019",
            "title": "2019 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1DwGfkiOLcJzPeZEDasfiaDats_QMMx5R/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2018-7",
            "year": "2018",
            "title": "2018 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1p0-zzpobPULxT-PMOJbXXQHcJprMZB5z/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2017-8",
            "year": "2017",
            "title": "2017 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1N9fL9fvpvwPeRuu5ik_oH82T-XtSYqi3/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1_FFgZ8-TMNfYaV2PKyn719e6BhrM5LZS/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-board-exams-2016-9",
            "year": "2016",
            "title": "2016 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/17EZHSoRPIcdFbMg9FIJuah2S9OMd0Emw/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 5,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "biology-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1dlxE7uMUj2QPO0G1ZitLskeURbbSG-1K/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1idMqTSJhSrk_K9qJOehI0cijaheREDhM/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1BXMgscUzq6a_eOspn9HP9iOsJb3Oq-xw/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Dr. Sunil)",
                "url": "https://drive.google.com/file/d/1iWfHp6IGvtAw2r4XBIL2UTmzGzANUrWe/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-model-exams-2023-2",
            "year": "2023",
            "title": "2023 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1UH8X51dmBTyaik-u8z8fr08f3OJRvjuy/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1SCduoQLK51F8ELA4sLi5sfuEfjR7Hgui/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-model-exams-2022-3",
            "year": "2022",
            "title": "2022 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1VOWKbzedTh1GUUzrP1FiVGvZY9hWuOdQ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1xPQDGu6Ro-7UrOgK2hvoP68kPCVY84Rj/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1Go0yQBBpdXFgqkOFdRqLSbAyyomqnDd3/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1-3yd5JG5SuznE98pdiAk3r3qEt4Wuj-Y/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-model-exams-2021-4",
            "year": "2021",
            "title": "2021 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1TopSjs8NWmLLC5LGeQWHW7Bh_IDBHnPh/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key 1",
                "url": "https://drive.google.com/file/d/13UfUxCJNu97Shqhq4mkdRDljljRX3iOU/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key 2",
                "url": "https://drive.google.com/file/d/1iTRdFTQNYhzlPb7aR4VwJIXi--8LkrrE/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "biology-terminal-exams-2024-0",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1ltgb0JPY1RWyJp4dQqfOB4EDflcN3EKE/view?usp=sharing"
              }
            ]
          },
          {
            "id": "biology-terminal-exams-2023-1",
            "year": "2023",
            "title": "First Term (Onam) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1TTqNq0uXtd6gRdohtzzBmf0gKkMb7y94/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/16ETTkuDj3VWSFP11XkmIh78vG2ci0La1/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1WKwEbazmP08Ow1vBW2OAm7MyxrUGl73s/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "chemistry": {
    "subjectKey": "chemistry",
    "subjectName": "Chemistry",
    "icon": "flask",
    "color": "#059669",
    "bg": "#ECFDF5",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 11,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "chemistry-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "key",
                "label": "Key (Anilkumar Sir)",
                "url": "https://drive.google.com/file/d/1Xh9RFLSKPCwiUd_IrtnAWTnjLVgdeWcl/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (General)",
                "url": "https://drive.google.com/file/d/1hPO_nWer-EHIKGdC-_UmmgIplmzy5jY2/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2025-1",
            "year": "2025",
            "title": "2025 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1VOjTnjQMlZwWupROE0KHyeCcoVqPZyp0/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1WdPZ2LNX4qjhqrxPoQVvNy0oZZZjvfrl/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Anoop Sir)",
                "url": "https://drive.google.com/file/d/1TwezKgpjzWtKRLIytecX8wEW13GHpXmW/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2024-2",
            "year": "2024",
            "title": "2024 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1XHOdVXNzYx-HZ5xGzonXxWRU2w1zmiRL/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Official Key (SY-525))",
                "url": "https://drive.google.com/file/d/1ovOr71hHjkliKlKAi2Nb_ebHfFTmOZdG/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (General)",
                "url": "https://drive.google.com/file/d/1sW0qtZ4jqqjc8LMsF6UxALcjIX0e53HG/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2023-3",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1xdlW04dWZC2OlcvYrThQ-3DrlTbW3IIV/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Anil Sir)",
                "url": "https://drive.google.com/file/d/1BFJX-myE4uwofwzZAdG2fEfFRLF_cwg9/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Part 1)",
                "url": "https://drive.google.com/file/d/15TGz99vhLCVo_0XGiCkqY69dhMjIdzfQ/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2022-4",
            "year": "2022",
            "title": "2022 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1IuS3gfK0NHADLVXVUjjgpadTPcyts22z/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1XyugJKc_aFNAqQYlpHbpU1GEWjjYgr5x/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Anil Kumar Sir)",
                "url": "https://drive.google.com/file/d/1VLull0ZFYYn0jdZ8SRcmo7g-xauJorNx/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2021-5",
            "year": "2021",
            "title": "2021 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1yTa5sPFwCCHrxZnslV-tx2Vy4wTOhFih/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1AnpqOghHFvN1JhmTYb5Lc0zsYfOplWW9/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2020-6",
            "year": "2020",
            "title": "2020 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1-zHz4BIbn5KcPSXU5OoL_4iLqmXxTDqZ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Santhosh Sir)",
                "url": "https://drive.google.com/file/d/147ICwDiiNFc58KF2RNvxM76M-8if7U5M/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2019-7",
            "year": "2019",
            "title": "2019 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1YKxL0GHQwwXgFcGS8RZIWRRtd55N0Fdi/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1LAqpYtTflCt3P3alV5m_-eg274tmZh9F/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2018-8",
            "year": "2018",
            "title": "2018 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1SvXIsAuOwN8PsMI7JPuXQPGwYk7wRicd/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1MHRjk6aO-IgnrBPb6_Amz5z-T_vyrqRP/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2017-9",
            "year": "2017",
            "title": "2017 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/166YafZCO1PKnpkoGijn6SqnZb9Yk9V7G/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1bGQl4__JnCn8erhYF_OaQF3_FwV99CR1/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-board-exams-2016-10",
            "year": "2016",
            "title": "2016 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/15b97N0glJ8CM6XwmkL0kOZkjQeWxs2k1/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1IZpa_aK2nE2bdDhUfGrFE6NmdFPbtdsn/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 7,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "chemistry-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1Ov-e-tdJFtUTcAyt3R12P8o5GJ4aCGLW/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1SblAa3bAj4o5jNHSBhoTZFO85OdAO7Sn/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1jacHIyZFY_C8xuKoFU_rba30nqTKAcfx/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1VXhorO7m3l9Ql3XvZ8tPGeIJ2IObFBFn/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1Bx-d_mzdhLYlRxuvIf3lNU4PbFbJCOqz/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Anil Sir)",
                "url": "https://drive.google.com/file/d/1h_ndnjIyt7B76VZgAohaW4vEyNyIMLks/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-model-exams-2023-2",
            "year": "2023",
            "title": "2023 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1kN_l-_PTRLVH5bexkxlKAmhSlR3bJDG7/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1_aN6Jgv4yjPBV9g1jNjzccVrAPi41Zt0/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-model-exams-2022-3",
            "year": "2022",
            "title": "2022 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1yFc4dvwqbCQYbKFkW1wPDhIIj3cpedsc/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1W85nc72LzjSmYu_GNHk5YmmgjkvRDeZJ/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-model-exams-2021-4",
            "year": "2021",
            "title": "2021 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/15dW_vxIMm-xJyNbtkHBNdiTcylNMmAzD/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1MsxTW_MD-V75LgZc2Dg1lt0vOueEB5jd/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-model-exams-2020-5",
            "year": "2020",
            "title": "2020 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1PvnwH2UBEYvSWE_h_C5wPkR3G3UDLQDB/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1czsnlwZkr_E_uqNgDrRWXlEX54A9Babc/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-model-exams-2019-6",
            "year": "2019",
            "title": "2019 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/18E12yaOnNwiC8TGPmotXN-vVVGRkuxEm/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 5,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "chemistry-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1T2VHK2Q2_aAPfB-gTltfZs9ZWMlPGu7i/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1xlM2leUwUc_ym9QJcSmfM8h8xxnK0fbP/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-terminal-exams-2024-1",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1aJBQmoYNm4BSarSYqZVs3iHA5c0OARfa/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-terminal-exams-2023-2",
            "year": "2023",
            "title": "First Term (Onam) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1_PlszNlgHS0FS-b5Y2vg6SZd8zIo2-uL/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1_Q-aS6ew7Y52I8TFlHS1ljw8RCc7oQiM/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-terminal-exams-2024-3",
            "year": "2024",
            "title": "Second Term (Christmas) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1jkLvaOsRxsuZ645CZxCnKne22Vh5m5RI/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1JzuXelhBejrI60ug9paBzoKS2nJuEzmf/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1sDD4rN_rgxr7_-cvddzjVgvb9-mfGdAi/view?usp=sharing"
              }
            ]
          },
          {
            "id": "chemistry-terminal-exams-2023-4",
            "year": "2023",
            "title": "Second Term (Christmas) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1PJgHkLHkZtb3-KoAF0OqiSBF4H6ksO_l/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1zStWuAzvxIbT9wO4oGKiGEs2Y6rq_LYz/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1wNDDZeJ5rmnkwBYY9GukPvzxAnHum88x/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "practice-sets",
        "title": "Model Practice Question Paper Sets",
        "cardsCount": 0,
        "practiceSetsCount": 10,
        "cards": [],
        "practiceSets": [
          {
            "label": "Set 1",
            "url": "https://drive.google.com/file/d/1a1bW4iXkkDeKOZqDZJ8Y_7hY0crqxQcu/view?usp=sharing"
          },
          {
            "label": "Set 2",
            "url": "https://drive.google.com/file/d/1AbeHisW5VNQwiVussjwD0uItsMSNtIeL/view?usp=sharing"
          },
          {
            "label": "Set 3",
            "url": "https://drive.google.com/file/d/1QVetpgHyNQfhN92sJm6K0C3NoW2wowCf/view?usp=sharing"
          },
          {
            "label": "Set 4",
            "url": "https://drive.google.com/file/d/1Acodbt22V2cY94KthZdPGqwKr6SyG468/view?usp=sharing"
          },
          {
            "label": "Set 5",
            "url": "https://drive.google.com/file/d/1cypOJIKHEuIQDDIuvunB6Z7B7xUmTkuB/view?usp=sharing"
          },
          {
            "label": "Set 6",
            "url": "https://drive.google.com/file/d/1KAr7T2cJ0qJtwonRmyeWdG_oBDrM-POk/view?usp=sharing"
          },
          {
            "label": "Set 7",
            "url": "https://drive.google.com/file/d/1_MYs1g1nfEZJUMc5X9m5gPhDS1R85nqO/view?usp=sharing"
          },
          {
            "label": "Set 8",
            "url": "https://drive.google.com/file/d/1_21rzPXMsNCUlWgkZO_4XpbOmGokCsgL/view?usp=sharing"
          },
          {
            "label": "Set 9",
            "url": "https://drive.google.com/file/d/16Ux18jZwM9TaUx8Au2ND2OXBO_A0iX9X/view?usp=sharing"
          },
          {
            "label": "Set 10",
            "url": "https://drive.google.com/file/d/17DJYnIZ-p5L2G_971A6zUqvNAg0mvbYS/view?usp=sharing"
          }
        ]
      }
    ]
  },
  "commerce": {
    "subjectKey": "commerce",
    "subjectName": "Commerce",
    "icon": "bar-chart",
    "color": "#D97706",
    "bg": "#FFFBEB",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 10,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "commerce-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam - Business Studies",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1V_LiXgfOfqkO1GXAQ8pr2IzMg_kDzMXR/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1HIRwq97Ot52w6J0Ekf-5H7HsCqcGi1rz/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2026-1",
            "year": "2026",
            "title": "2026 Annual Board Exam - Accountancy with AFS",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1RjkQm0aDyWKB_5HyBzIiGU_cpIySQZQm/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2026-2",
            "year": "2026",
            "title": "2026 Annual Board Exam - Accountancy with CA",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1rGjd419K2JPAUNeBbHvdbKqnLl6F7O1T/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1MzT3_MbfD8TaQcmZBBjROdIoBUxy7SNX/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2025-3",
            "year": "2025",
            "title": "2025 Annual Board Exam - Business Studies",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1_MmE5H9ENO5K0wYMXvauunV3p9xgCTnH/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1HO9zCK2UgrLlRmwXO9zx9rEMkMGh1-L3/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Prakash Sir)",
                "url": "https://drive.google.com/file/d/1SXJRt4KXTAHTg5h0j_0fXe3x1agvuXGn/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2025-4",
            "year": "2025",
            "title": "2025 Annual Board Exam - Accountancy with AFS",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/17NLdyaoEmf12uvONTCGlYqcOZCW6b4Pn/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1BXA2AwVFLtnTEeZuj2HBLQH5WlgSUEc2/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2025-5",
            "year": "2025",
            "title": "2025 Annual Board Exam - Accountancy with CA",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1QySxinQGWSO3kCixVdR-IWXl26MwOCiY/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2024-6",
            "year": "2024",
            "title": "2024 Annual Board Exam - Business Studies",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1yWbZmlahxnQI0ose1FZSpQhlcCuCYP_6/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1cBdu8faMb4nNOrW1FFc6TCAO6o0IAGB3/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2024-7",
            "year": "2024",
            "title": "2024 Annual Board Exam - Accountancy with AFS",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1YQcoOtIn3Yy7fKMD2PNx7cN_KuGoi8Sz/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1UP6JsjQj8OlKiZcxLnitdNGvPx5SjM93/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2024-8",
            "year": "2024",
            "title": "2024 Annual Board Exam - Accountancy with CA",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1lPM54dhqFn1D7eFEWGAo768ctU5NBKQz/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1zv2j_EXKpQZOX1iPKReYCB8JvHVt6YyP/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-board-exams-2023-9",
            "year": "2023",
            "title": "2023 Annual Board Exam - Business Studies",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1BNfUSWADYCvA_NVuP1ucMeKdMQuVHD1b/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1u6PoI7dUs_n53YQM_lZjDp30rsXJMMJF/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Shaju Sir Alappuzha)",
                "url": "https://drive.google.com/file/d/12t8aLD9JCcUY-gDj3yOxgQhWVB0Gz_Bb/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 3,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "commerce-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam - Business Studies",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/11YLeUlVcL-89Sn0zjsB9kIdDPMD7SH93/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1pfbgkkqNNrsjF8Shw3B13sPN6hbUdiqH/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1eaNfXz6TeWUPKrn5LtJzFLpSWrn-nug7/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-model-exams-2025-1",
            "year": "2025",
            "title": "2025 Model Exam - Accountancy with CA",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1H1yJp3RaCel1BPlhKQbPLgHS2lr6pzC3/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/13OD4LKqHRfyyx2DB4HFtibJDbfuTPkbz/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1aWsDFq0w0sZr_T5SeqmPfX58PZIO8RPZ/view?usp=sharing"
              }
            ]
          },
          {
            "id": "commerce-model-exams-2024-2",
            "year": "2024",
            "title": "2024 Model Exam - Business Studies",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/17Avatg4MzD8lyZZaxJccyy4Nf1bwW3Nv/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1XsKV1xcStohOZEKTXyC7Uhm6C3qFDHzb/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Shaju Sir)",
                "url": "https://drive.google.com/file/d/1hNRjly4-whRmr7l783_EL2IojzCzg_xm/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 1,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "commerce-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP 1",
                "url": "https://drive.google.com/file/d/1n8kX-0IKwIRd7yqu3XSZbESyYc5UgMCB/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP 2",
                "url": "https://drive.google.com/file/d/15ARqNBBk4F4dEI8QydD1kZ41y_XEyeRa/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "computer": {
    "subjectKey": "computer",
    "subjectName": "Computer Science",
    "icon": "laptop",
    "color": "#7C3AED",
    "bg": "#F5F3FF",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 10,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "computer-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam - Computer Science",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1qvO7nbAv3YEoqXZyHIrwydtOgsC35h8N/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1UDMcp1QDNHckIRLd126jAMEMY7WWe9ff/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2026-1",
            "year": "2026",
            "title": "2026 Annual Board Exam - Computer Applications (Commerce)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1Zj9JOlVnt1ROdeNY6o9HXSY2Z8grvTSr/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1O1gnhLh9v88O2tcesQ4ozyP_Labmib_V/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2026-2",
            "year": "2026",
            "title": "2026 Annual Board Exam - Computer Applications (Humanities)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1o89ug7pa4OiyXf5szloYkWWKjOAakEG5/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1F9RgaXPKqX_lyJfk9UECeoUkZU1BFZTJ/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2025-3",
            "year": "2025",
            "title": "2025 Annual Board Exam - Computer Science",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1YFHLn38y-5snbFOje2PLZ4-2GNs0WOMx/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1oTJ_kmlLcE49dL3n9GeMf6wJnp4okAHU/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2025-4",
            "year": "2025",
            "title": "2025 Annual Board Exam - Computer Applications (Commerce)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/17W8gPa_UMFqRTKR2c-basOaTNY2FkEtR/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1fwq2JEYmJIrVHZwIxceZsKwwss-Qh-aF/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2025-5",
            "year": "2025",
            "title": "2025 Annual Board Exam - Computer Applications (Humanities)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1M_9g8VO00jSs6xBdym9S6_QHC9GKplry/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2024-6",
            "year": "2024",
            "title": "2024 Annual Board Exam - Computer Science",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1qxNhhyZOCsr1-hW8MKnwEjME6pnLkcWO/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1Xs3p39M84Ejim02-AhZYs-qPVvz6BJeh/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2024-7",
            "year": "2024",
            "title": "2024 Annual Board Exam - Computer Applications (Commerce)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1kgUOkbHj1_FqowM_Mtof2woJjmAS88_y/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1g9XSYxf4hcM5yNhuQE-af9uqD-0taEAI/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Official Key (SY-546))",
                "url": "https://drive.google.com/file/d/1uFh4ZzSYT9qfAlYxWyIwuDKB6zv5_3fL/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (TCA Gafoor Sir)",
                "url": "https://drive.google.com/file/d/1hI3d_XCRDbjC6mkaLM3iOaB5zQc4OSjF/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2024-8",
            "year": "2024",
            "title": "2024 Annual Board Exam - Computer Applications (Humanities)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1K2HP44aMAhjHZPupsvnPH0vBeO4f_w-d/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1R-YXyW3OhdIaSus85UMOKVN_rV52u9-E/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-board-exams-2022-9",
            "year": "2022",
            "title": "2022 Annual Board Exam - Computer Science",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1JbFni4XBPQVE6ylLKN7kdoyVkoso6aVT/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1Zuz-zS4B-jYbF5yELQNReS9gX3L8DsSO/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 3,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "computer-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam - Computer Science",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1B2eq-ZzTtPWKpPAXBX4X6fJ1HUWFTiaZ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1OJRwiLnAi2Qnvp7r-05WA9rpT_BUL89O/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-model-exams-2025-1",
            "year": "2025",
            "title": "2025 Model Exam - Computer Applications (Commerce)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1GhR_XCHT6ruKTUv4bdqUS7nVpQtPd5R6/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1h9-1CiA64puSQhTsfUFjmI0ngR112Smb/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-model-exams-2024-2",
            "year": "2024",
            "title": "2024 Model Exam - Computer Applications (Commerce)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1pUGLR6KZCrbVRBsb3wI0CO-XYwTLl-w6/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1vzpmgNDPJtle-gWLa_sXOeQf4MiCv--5/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Gafoor Sir)",
                "url": "https://drive.google.com/file/d/1upN7m-7A8EYPwPeNPrZd6r3NhkqtauLE/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "computer-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025 - Computer Science",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1NCWyXbuUMOwmGO17BSJX2y4m7Trs3aNy/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/16dswFLFinY4kOhwyCSxqsrGc8_2ldEMc/view?usp=sharing"
              }
            ]
          },
          {
            "id": "computer-terminal-exams-2025-1",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025 - Computer Applications (Humanities)",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/10W9weQjJibkIAv6R98h1Y2oH4XuG35A3/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "english": {
    "subjectKey": "english",
    "subjectName": "English",
    "icon": "book",
    "color": "#EA580C",
    "bg": "#FFF7ED",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 9,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "english-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1O4vUtXGnrbIk6qEGe9ofhyjPCgOBnV0s/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1_ZgcYX6G3g52-CHUA13wjbRJHrpZnegj/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2026-1",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/157tYv-oSpjgO4uf-SO-rpPFrmw6yQS_p/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1IA3jx7ZF2M5xRERgjofUcB1qMVzaUo4r/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2026-2",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/12I1l9b1XiDaq1XwYF5-m3gHrGQQo_I2C/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1vvTX-GeyPh7PoBoj7LlJUt-94c-uTbD4/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2025-3",
            "year": "2025",
            "title": "2025 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1J36mmGx6iyrotW5uHaA7lV8xtCUZeFDJ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1m6649Bbdz_OY_kFqXRKA_MghGo_dRMIb/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2024-4",
            "year": "2024",
            "title": "2024 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1LXvd4t2NlCD3_hmLniaGbxAT57vjtj2s/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/17VCXzzyUNwUCZeKZjGcf-aaGJMiAwP97/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2023-5",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1EJMcPLG_CQBbPJN7NMB-UuLh4Iy63rPw/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Sunil Sir, Suhana Mam, Joseph Sir)",
                "url": "https://drive.google.com/file/d/1uYZdSxoCJzE7OWyCrL3eFnE53TRlqi0x/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2023-6",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1__G9KkCXzg45tGr3EUXD6tu-7RysJj6D/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1h58P9le4pDfi112Yrst4SRncWXo5QsSX/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2023-7",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1urMPGRzdo9MGpGVoGF3a5duJz9ngFFeb/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1kWwAWbmX8Wn_TftXQt5Lts5UTmAqsfTe/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-board-exams-2022-8",
            "year": "2022",
            "title": "2022 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1NGpMbGMZZZ6EFaw60VZpJgghBF1lgLx2/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1l6Pe_6cUKf8_cHPpO16KmY6MfMvkjep9/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 3,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "english-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/11ZxxxItpcMVaLqPlIx0XrH32xyVO24RM/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1SMTlRFG_OCpOa0Ex1rjcLo_CkYVUnz_U/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/10o6QZOSGMxjbcqKrjhR1uWN6xwT-5nuJ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Sunil Sir)",
                "url": "https://drive.google.com/file/d/1A93MAcKlLROWUxpZscApTyyoJyx0KwOm/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-model-exams-2023-2",
            "year": "2023",
            "title": "2023 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1wavTZonQMqtUoqxnwJC-g4eHlsn1mOE_/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1cMA96nKOLeJt_44rMQgaov5o0xofqrtQ/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "english-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP 1",
                "url": "https://drive.google.com/file/d/1XVJr2rO9d0j2AUxdINYqCrhSkhPYLx-p/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP 2",
                "url": "https://drive.google.com/file/d/1ALBh62Mk-DOEt-0W3eKtMm7fxzXrTT-S/view?usp=sharing"
              }
            ]
          },
          {
            "id": "english-terminal-exams-2024-1",
            "year": "2024",
            "title": "Second Term (Christmas) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1SGgMnkOtEkSN9w2037mgZx0cn8eVAEC5/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1P_IhOd56WDIn4xGLf5LAoypEQ4vuST4f/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "general": {
    "subjectKey": "general",
    "subjectName": "All Subjects (Pools)",
    "icon": "folder",
    "color": "#475569",
    "bg": "#F8FAFC",
    "sections": [
      {
        "id": "revision-pools",
        "title": "Key Multi-Year Revision Pools",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "general-revision-pools-2022, 2019, 2018, 2017, 2016, 2015, 2008-0",
            "year": "2022, 2019, 2018, 2017, 2016, 2015, 2008",
            "title": "SAY / Improvement Exams Pool",
            "sectionId": "revision-pools",
            "links": [
              {
                "type": "qp",
                "label": "Browse / Open Sample Paper",
                "url": "https://drive.google.com/file/d/1_gJcpof4Py_WXnimzBt69q8enPURcSd2/view?usp=sharing"
              }
            ]
          },
          {
            "id": "general-revision-pools-2025, 2024, 2023, 2022, 2019, 2018, 2017-1",
            "year": "2025, 2024, 2023, 2022, 2019, 2018, 2017",
            "title": "Second Term (Christmas) Exam Multi-Subject Bundles",
            "sectionId": "revision-pools",
            "links": []
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "hindi": {
    "subjectKey": "hindi",
    "subjectName": "Hindi",
    "icon": "language",
    "color": "#E11D48",
    "bg": "#FFF1F2",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 3,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "hindi-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/10-LnLzM6OPROoEChyodXDdpUPFfHXC2M/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/15rXwPGZACsTjjhInXsccEV6_xKKgGAd5/view?usp=sharing"
              }
            ]
          },
          {
            "id": "hindi-board-exams-2024-1",
            "year": "2024",
            "title": "2024 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1X3KWDdtAh8S2viKnAKXOzep2uv3_niW7/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1_3valdRe076Ztm8w6fyac3wzh4bbVFPd/view?usp=sharing"
              }
            ]
          },
          {
            "id": "hindi-board-exams-2023-2",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1ChEcOZVD8RsuGA4glcku_8wtg8KiaO3c/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "hindi-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/11kppeS-r8QptWIt2dXb0UISPWsXdfFXx/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1iSUzhFV6BxcUyiiyfqRmVER_V9wq7MXX/view?usp=sharing"
              }
            ]
          },
          {
            "id": "hindi-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1lVIZKTxRkIZr2_-A1oI7MSnlYcXxh_xQ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Shaji Sir)",
                "url": "https://drive.google.com/file/d/12359dI_xDe66JCFGXhGRbVPl9FX0btyt/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "hindi-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1B3jOfHUGZn0ozWqB2e_s4vg1VP8sLZLy/view?usp=sharing"
              }
            ]
          },
          {
            "id": "hindi-terminal-exams-2024-1",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1rN5d2ITlIoLxyGKNMpgcdC2Ib_FMtdOv/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "humanities": {
    "subjectKey": "humanities",
    "subjectName": "Humanities",
    "icon": "business",
    "color": "#9333EA",
    "bg": "#FAF5FF",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "humanities-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1DYIq4VbM5a4P-LGdq5o4MH5INFU0H88E/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1HjWcIODYi6VfI_9NycNTerUrw8dHDkSn/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1sKBtY9f0Gnu6v6WGyPo5hpLibWF7CdcJ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1sPmRCR3caQuSnN3rgCghz6dgPo3LTOS3/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1yiz2K1L5xRBwDaC6axECCxKVuyI6ycCJ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1NUuIwDCYUxXPeT3mcImsgnOA7q01Q2BP/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/124l3yJ9V6pCJJl1RCECgYQLbuiAbPUHA/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1VcSxrhDRN_7TmlyHswDCC7e-1xZKe5pT/view?usp=sharing"
              }
            ]
          },
          {
            "id": "humanities-board-exams-2025-1",
            "year": "2025",
            "title": "2025 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1rO6u5JhbIS-3KRzLim45duLu47N3YlFe/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1W2whxV-glv79H0ez-AhnHGlgFGwlYEph/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1KsFhZ2PreC_JGd1elXf6DN8Z3VZvx2wC/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1EWJbAWimnUilanQReJx33OEP6aY9bYFL/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/17YUyubzkJ6N5R_DJpIwX7-kyY1wBfLxE/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Saifudheen Sir)",
                "url": "https://drive.google.com/file/d/10gbGXLsKj8iEECdkSYXIsZZV--KtlSJ4/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1N8_0Dbgq7SC8D6E5x4JRWR3G4vw4CQRf/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1rEuTzIKoEXRfh1_MED91m1e8WhPIkvoM/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Lukmanul Sir)",
                "url": "https://drive.google.com/file/d/1Kb4s7tKAdISl64NofKyrhKvmB8J1_rBX/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1Gcex8UAB4PQu8Ez-WtB4nkVudMBARj5u/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 1,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "humanities-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/19NIt3EtNyF-l3A4y5SLiHmh5jJ8bP0YI/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1W9NQDW0gMk3yeY2uBOqlG9_QnWfIemrQ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1Mxv0dNaswAQTRahnJE6MDWYgzCIUJJly/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1bSPTLTV2CTje8Ua9w6pNmaBXEraJE1gB/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1kT8AduBhLeAh1_am_yf90qXoDnNBfcL-/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1tFgge_2Z-yS7JRAHtdQq_0F67s24M9sm/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1cnVr1Zo-sBRB5C7_AVOE0KxKPcm540-4/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1tu6uDM5R7GVYFrMMsFyygBSLXcj6BK-W/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 1,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "humanities-terminal-exams-2024-0",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": []
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "malayalam1": {
    "subjectKey": "malayalam1",
    "subjectName": "Malayalam I",
    "icon": "feather",
    "color": "#DC2626",
    "bg": "#FEF2F2",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 4,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "malayalam1-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1LBtka4xhaPB4z2FKdlMjN3nyxJzBxMGs/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1BGcQjODAHD5qIRc4j-wX9vVHpjLnOqeN/view?usp=sharing"
              }
            ]
          },
          {
            "id": "malayalam1-board-exams-2025-1",
            "year": "2025",
            "title": "2025 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1LmWs5b0r37o17bpwu6NIvaD-ShT5bjsF/view?usp=sharing"
              }
            ]
          },
          {
            "id": "malayalam1-board-exams-2024-2",
            "year": "2024",
            "title": "2024 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1jTFGGoT3KFrpDoKy4UfNtQBTZtyt4-C7/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1kxkqAwpiED_KMTRen4W896tHo0LV1L46/view?usp=sharing"
              }
            ]
          },
          {
            "id": "malayalam1-board-exams-2023-3",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1wDCLX5O2ZoudkD2r_NJEypNhZfsJ_G4C/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "malayalam1-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1tcgtLluXVkyW040--ISkJLBZCsqp7gu1/view?usp=sharing"
              }
            ]
          },
          {
            "id": "malayalam1-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1jdB_O0StUhexmKVXiXLQ1juECzmyBD7A/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "malayalam1-terminal-exams-2024-0",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1pDOk42kPYtQy6Ooce96GnbopeJ26h_wK/view?usp=sharing"
              }
            ]
          },
          {
            "id": "malayalam1-terminal-exams-2023-1",
            "year": "2023",
            "title": "First Term (Onam) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1iboH1wvzs3WEfKWC3S71tAJY7WW4iXX6/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1mnB2GpasKqt0Aa3HNZPjNZkZtutdo5Lc/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      }
    ]
  },
  "maths": {
    "subjectKey": "maths",
    "subjectName": "Mathematics",
    "icon": "calculator",
    "color": "#2563EB",
    "bg": "#EFF6FF",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 13,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "maths-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1jUX1jytlD9Y1cMuanfzYHq-jlRyephax/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1_efiMdFiNvuHG94Er-MFmb6ZNRD-kt35/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2026-1",
            "year": "2026",
            "title": "2026 Annual Board Exam (Commerce)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1wx3jSj7x3tsNs7Y32SqunIBlWWG6JlYq/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1tb4bS17ry66GSpGDI9N9cOlTlYLpcOSE/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2025-2",
            "year": "2025",
            "title": "2025 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1H0eQ4SxclJv8VWqQQC6aL-UVzQ1zu0QR/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1EHOYViE-RGozqeQkE3a_0UQ32cSp7v9l/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/155JCnBEEFlVaMTym3VVvcDCTEarTLVPo/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2025-3",
            "year": "2025",
            "title": "2025 Annual Board Exam (Commerce)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1wOwKLuI0GGP9IFp0U1_dLSScFH0kgt4y/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2024-4",
            "year": "2024",
            "title": "2024 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/14MU-4PiZfKUcVX9_hF7fBTCrofmQlIgi/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Official (SY-554))",
                "url": "https://drive.google.com/file/d/1KrBSkw_WFyB557ryYvpmz3TTFxZJA2sE/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Anoop Chennassery Sir)",
                "url": "https://drive.google.com/file/d/1syhVJYEwPJXBjj2BEL6Ern0fXZkd0q0B/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (RAYS)",
                "url": "https://drive.google.com/file/d/1awq-I3o4ZnX0fp7tQcc9DhtqwEDG1Rss/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2023-5",
            "year": "2023",
            "title": "2023 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/18SkkNxLjNN_sJNMiB_ADVNPKMN1GrYXL/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (ANONS Academy)",
                "url": "https://drive.google.com/file/d/1C4iWpH5uu7daaaY4ULT0GS7qcTl79pTS/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2022-6",
            "year": "2022",
            "title": "2022 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1HbJRaJ6k6BmQWv-lHyAhMdF2Yu2iUg3H/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Ann Saby Jacob)",
                "url": "https://drive.google.com/file/d/1NAxhxwNYFm8Bv2lguQHrfFElTvyxCB2J/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2022-7",
            "year": "2022",
            "title": "2022 Annual Board Exam (Commerce)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1GwNaZHWSU2h_tFB_HJRE9Gk8gN8IkaK_/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1C1L7Z8ApnWVPyyr2EO1BiMIQQuKl7emL/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1kD-mfC7__Bc_nw6i7fvqdnn58mEukSVn/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1etTFtDfXP8d6T5acjDwgW-13DVLcN_Ji/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2021-8",
            "year": "2021",
            "title": "2021 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1YneoLAIm6x9xiLICXNhMMch1ZqksVbXV/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1fESz_i2Q29SZ7UJ3JFXmHa-UsZaR0ifN/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2019-9",
            "year": "2019",
            "title": "2019 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/12r93WRfHZC5KxiSs5RxsV0EuMjB7WGMH/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1YE4wtVKL2-KdUG1K5eMfhEz7NH1fF78U/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2018-10",
            "year": "2018",
            "title": "2018 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1qKCH9Gq5EMhuna142niBppfGDQJrBqTJ/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1IZ1uW2pA40JPkZNPXGfKAVH3KTP0WCwL/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2017-11",
            "year": "2017",
            "title": "2017 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1MfjQ0muPzA6wr-BP1MO7G4a__UAnvEMd/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1xQF84LkPbuPSD4h8BczwWTTgihaPvvIF/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-board-exams-2016-12",
            "year": "2016",
            "title": "2016 Annual Board Exam (Science)",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1ePC-5jZ_pP2SXyVQLmoPPIkXKyxAQjWS/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1U53DFu-lWxBoqRtWaN0EBiWxD-dFVT6B/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 7,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "maths-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam (Science)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1ImlJkiJsXqrLxk_pvzuUQ_nYULJplDrm/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1m0idx3fRZQoLAs-Ha6FSgMA3sXCMgxJc/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1HAdi0p_qL3HX7QQ9OQOAV0sth4fquOcb/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam (Science)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1KvZi0qkmsuvDZTfRxHjtfU1GMStbUs2L/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1Q2frlLxTxHgX1223_IakIEpv6ERpcBlO/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1_EzYMxesjj-A0SWKbcJtuo7dpzW5eXfz/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-model-exams-2023-2",
            "year": "2023",
            "title": "2023 Model Exam (Science)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1NUXyqXvnaZCPC4OzY9OHuTMlxcsx5oJS/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1tYEFcMzuHKEOfaEuzNrYKlJ69ky31iY5/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/123ye1n6gtYJ80x-M82u8jLd02nLVBuT3/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-model-exams-2022-3",
            "year": "2022",
            "title": "2022 Model Exam (Science)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1zKIJCi7wq2aOnKzetpOdfFl7TwRXZnfD/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/11VpSQXfT6UTomPa8VLX6Oe9733xczrHJ/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-model-exams-2021-4",
            "year": "2021",
            "title": "2021 Model Exam (Science)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1gVwDgxoKXRW0jeyZ-OXiD8vu5BZ-5f4n/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1-lz02FUcK347iFeonIUWP_gcjhCkZfA2/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-model-exams-2020-5",
            "year": "2020",
            "title": "2020 Model Exam (Science)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1jitDhzX1n-M9SL1-cRETiaqk0A2RPM-0/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-model-exams-2019-6",
            "year": "2019",
            "title": "2019 Model Exam (Science)",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1cQtx0HYySqbYyfLcM62L1rdMNjMOGN-X/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 5,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "maths-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP 1",
                "url": "https://drive.google.com/file/d/1VmC_R69O5gr-IyVUqxz6fejOQBEvckjW/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP 2",
                "url": "https://drive.google.com/file/d/1Y09aOfsBgS77JL_qAkoMgD3zjFpZLbyH/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP 3",
                "url": "https://drive.google.com/file/d/1RBGrIWqxpjHaqHVZEaHJEXLlNxzUWBqe/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1HvCl-U2TilD3Dw98XcHxkg_VC4Yx45Xm/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-terminal-exams-2024-1",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1wCxNjZSS-smJCkZiiSRHgQbDHmo4HFW8/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-terminal-exams-2023-2",
            "year": "2023",
            "title": "First Term (Onam) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1aZKxa2O_5U7CgXKPecs29KHBoacqf8yy/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1eH1PJpJFUKzRUDFHXWJktjt6QHqpV38a/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-terminal-exams-2024-3",
            "year": "2024",
            "title": "Second Term (Christmas) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1mFIs8IfH_1HTuxGjtxt0Uc5Vx63ZsnHk/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/17C64jd_cXt6CLui8Zf13aqdRXB9eY37R/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1ZfPggkBnuilmpSWZnvsHVCIN-0xSCCbj/view?usp=sharing"
              }
            ]
          },
          {
            "id": "maths-terminal-exams-2023-4",
            "year": "2023",
            "title": "Second Term (Christmas) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1OMxB2hhajR3UVz557Lay7uE4OGada32f/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1bY8xrzgoosXu15loE6rJbhHyg3Oj8Xar/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "practice-sets",
        "title": "Model Practice Question Paper Sets",
        "cardsCount": 0,
        "practiceSetsCount": 11,
        "cards": [],
        "practiceSets": [
          {
            "label": "Set 1",
            "url": "https://drive.google.com/file/d/1heM2QqgYASXrqIdUXRN2LZgdUUeZfW0A/view?usp=sharing"
          },
          {
            "label": "Set 2",
            "url": "https://drive.google.com/file/d/1ZWB5EYKuO4j2hcziLNEnbFGNOZOdPBBE/view?usp=sharing"
          },
          {
            "label": "Set 3",
            "url": "https://drive.google.com/file/d/1bsgUltw7j2RNUukzxjob2bExoMAXcCbr/view?usp=sharing"
          },
          {
            "label": "Set 4",
            "url": "https://drive.google.com/file/d/1RQ0aTo2OU1GyQ-tGxJeBeFKjWnzn2PKp/view?usp=sharing"
          },
          {
            "label": "Set 5",
            "url": "https://drive.google.com/file/d/17qCl-KX51DTsb5ul5dyzWlcLTTDEymDl/view?usp=sharing"
          },
          {
            "label": "Set 6",
            "url": "https://drive.google.com/file/d/1dSTHfcBVFDYbldhEdML8Tm8n4WUTHCbT/view?usp=sharing"
          },
          {
            "label": "Set 7",
            "url": "https://drive.google.com/file/d/1LeB6urZyC77NtHPgxhgrImS0svlS_f7r/view?usp=sharing"
          },
          {
            "label": "Set 8",
            "url": "https://drive.google.com/file/d/19W_FxXqYbWYkUJfI4SZ0j0rrRBU6wGGJ/view?usp=sharing"
          },
          {
            "label": "Set 9",
            "url": "https://drive.google.com/file/d/1_6HEcMIb0ZM_gfqQIaKqJAlUCdSwAxfe/view?usp=sharing"
          },
          {
            "label": "Set 10",
            "url": "https://drive.google.com/file/d/1pxhPfe1h56zDU2ocl4BykNQkLCRag2tA/view?usp=sharing"
          },
          {
            "label": "Set 11",
            "url": "https://drive.google.com/file/d/11URe5oZ552SOG0qj66dIy1Gn8ZEd7_TB/view?usp=sharing"
          }
        ]
      }
    ]
  },
  "physics": {
    "subjectKey": "physics",
    "subjectName": "Physics",
    "icon": "magnet",
    "color": "#0284C7",
    "bg": "#F0F9FF",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 11,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "physics-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1Wo6tA0IfeeQS8CBx5T_FOfuU-DdjtEK1/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Lalan Sir)",
                "url": "https://drive.google.com/file/d/1VEzGzA76hya4pTmOWsrPUuzbD_97mvv0/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2025-1",
            "year": "2025",
            "title": "2025 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1LdYJtUpPRaJtzaJ76FJDiMUVicUnYgCK/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1sAvOHy16tV3OxFbt3FeedbAA70sNh8vB/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Lalan Sir)",
                "url": "https://drive.google.com/file/d/1LYJPE8Boc_NHstQiBZWAPv3RIddywHqe/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2024-2",
            "year": "2024",
            "title": "2024 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1N1Q2eUpu-hNihKlOxQ-BmsFkwueth5Qc/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/198d4pL6WT6Zi5Gy-oL3aLD52pn8BzRwT/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Official Key (SY-524))",
                "url": "https://drive.google.com/file/d/11W2y92ymHeppEC1SOtCj2kdLJ0Lf_xGe/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Binu Sir)",
                "url": "https://drive.google.com/file/d/1qQYwM6rXvtGNFypGjuz4oWjTuiioQeWg/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Irshad Panoly Sir)",
                "url": "https://drive.google.com/file/d/1qashD-w-SwHvmSkMCgJKJUurd5X2klfI/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2023-3",
            "year": "2023",
            "title": "2023 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1syLsgEgJ0Xp2AM_zdHsoOs9YvHRAG-fO/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Lalan Sir)",
                "url": "https://drive.google.com/file/d/16CnLqJzrVPk2nd-n-u-UBY-uYlffvkDz/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2022-4",
            "year": "2022",
            "title": "2022 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1mUBhTxWZIPYpejTSbc1Nnbd6x1uasewS/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1jnbm7PP3NyyxMLnl8T7nZUTAo0R6Jtj8/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2021-5",
            "year": "2021",
            "title": "2021 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1TJ-y0UZfB9l-F8NYpbi2-weCNg71hZEk/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/11K2hLhAk311rbaPO_vvKOIRbsWhuA29v/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2020-6",
            "year": "2020",
            "title": "2020 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1J13KxRoFIqEdEP1JUQRh606WgP9ogX5K/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1brnie_cFNE1Xt2J7KHcopzCjP0VYpbdf/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2019-7",
            "year": "2019",
            "title": "2019 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/12LXov-w9-xiqK1acwmAnfopi1LLKXgie/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/13Z417LGXs0fkbEPsjef0WKteTdQGd9vA/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2018-8",
            "year": "2018",
            "title": "2018 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/182uXsFvtZHGYCSNx0sNZ5oYbIA_7ewlk/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1765VcuKCvriM6P29DCfTF9L71elpVStn/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2017-9",
            "year": "2017",
            "title": "2017 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1B9ulXs-btLOhKcq4khvr6uPWFpwi7gQ_/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1n6r3txAigEkr6bIynR7Rb9GgG8alhI5Z/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-board-exams-2016-10",
            "year": "2016",
            "title": "2016 Annual Board Exam",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1gxd8ao_-HJmKawrPESrVXFAsaznScMF7/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1f7c5_qhEGw6eNc7hcXA47gwYe3jgXLqY/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 7,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "physics-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1w4OFhPF5fl9z5oTlZs-RYUDh3NaMQnH5/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1iMZqNvMBcx0y9bKafUp3HZ03HKGZIztR/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1o4nFjOZq29LA-k3vYbbGnRe0X4IIxwgo/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1BMuu8cyZPgjeazGpCA4D8JFLf3o_sv0p/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1WwwcNSYBW981K0eQKtxqJz53IsGWXMmV/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Lalan Sir)",
                "url": "https://drive.google.com/file/d/1w38DDnSmfTZCSQuYUNL_OH4sjPlDUU-w/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-model-exams-2023-2",
            "year": "2023",
            "title": "2023 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1UQivOhXqA6M5mmWF9z4DJQ7M-fKksvyv/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1XA80N0rWa0npKglZs1I7WnsBBTh627iz/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/154pPbdLUcDZ-CLTMblz9H4n2EVx6bbpm/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-model-exams-2022-3",
            "year": "2022",
            "title": "2022 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1AcZjJtElge9_dBesJvbn_nEs47bvY_-U/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key 1",
                "url": "https://drive.google.com/file/d/1ByYWV7I3eaEz_Ks_QNsYRVPoidnEP8nV/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key 2",
                "url": "https://drive.google.com/file/d/1GTPm6zRiV4LHgsVX_OjRZp-9bJpnJZxT/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-model-exams-2021-4",
            "year": "2021",
            "title": "2021 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1S3Sf38okEIb_8WD6Q1WIBIZ9X5jG63Ka/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key 1",
                "url": "https://drive.google.com/file/d/1r7PRMUh8O08-A9c-6p-JhylRf8JHuAVe/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key 2",
                "url": "https://drive.google.com/file/d/19-ZVT1DE4oDQLS2XXQNOmTAFymQj93Fh/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-model-exams-2020-5",
            "year": "2020",
            "title": "2020 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1VdVKrQG5K2whiJqWOQNeeS5FlJ1vyxEB/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1xUuQybufLH6lhl69NWw0Kr38qPFBnMzk/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-model-exams-2019-6",
            "year": "2019",
            "title": "2019 Model Exam",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1BW-o0uXclGn-mvJHZkbjHi9wpaGzOvlu/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1kGWF33jEyc599h4o_5XYVjG45uGfY-U4/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 5,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "physics-terminal-exams-2025-0",
            "year": "2025",
            "title": "First Term (Onam) Exam 2025",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1NE0_kQ-150dK-G_MrKelaqZwZ0FH4LoB/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1xV3EZ2N1DRssYOuThORqsLqUWipOX1Vu/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-terminal-exams-2024-1",
            "year": "2024",
            "title": "First Term (Onam) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1Lk_n9z9AB2M5lBUtXztOOcMXNYrckEOh/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-terminal-exams-2023-2",
            "year": "2023",
            "title": "First Term (Onam) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1-XDbWEAbk46C1-nEKmXsUaT3_Up4gvLE/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1PzEMoJ5m9ND7_TNEO4i9gRGCiq_xtjag/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-terminal-exams-2024-3",
            "year": "2024",
            "title": "Second Term (Christmas) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/13hebRkX0U4YjUzoTLGlSmO76l1zV_dTI/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1pdq7dWRgj_kbPiS-dC10a7nBuGIEVEJw/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1VnUHF3-yJxnfrURTYOsr1lcrqmBywlml/view?usp=sharing"
              }
            ]
          },
          {
            "id": "physics-terminal-exams-2023-4",
            "year": "2023",
            "title": "Second Term (Christmas) Exam 2023",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1ci5jYEuYHTtIgOJLc_-gk2CjHi-SPJ0o/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/12l28RO8U4qoV-CzubsXEb0zZee8SfhNL/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1hmNXZIOYariyOdj7X1XEdisuUCuo_7Ut/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "practice-sets",
        "title": "Model Practice Question Paper Sets",
        "cardsCount": 0,
        "practiceSetsCount": 12,
        "cards": [],
        "practiceSets": [
          {
            "label": "Set 1",
            "url": "https://drive.google.com/file/d/1hishdOPYYVNTJGhonq8TRnIT7NG_se0Z/view?usp=sharing"
          },
          {
            "label": "Set 2",
            "url": "https://drive.google.com/file/d/1nI0HeuSZLAT4U0LEtdhsnBp1u1SjC1TY/view?usp=sharing"
          },
          {
            "label": "Set 3",
            "url": "https://drive.google.com/file/d/17Uigy4ViOInKX-qpKhDcyyXIqPmBV0K5/view?usp=sharing"
          },
          {
            "label": "Set 4",
            "url": "https://drive.google.com/file/d/1cAbwwSFVIdnm0Tg5_6UeC50uiV9fQYBc/view?usp=sharing"
          },
          {
            "label": "Set 5",
            "url": "https://drive.google.com/file/d/138VkUu1slEWOOahPddtP_uTdvbHg3Ikn/view?usp=sharing"
          },
          {
            "label": "Set 7",
            "url": "https://drive.google.com/file/d/1E3K4gVFpBnwmvQPVc8UEl5Y-wN2gTuSx/view?usp=sharing"
          },
          {
            "label": "Set 8",
            "url": "https://drive.google.com/file/d/1Im0h1J6TIy5VGX_bZT9lc9zuUE4tw7nT/view?usp=sharing"
          },
          {
            "label": "Set 9",
            "url": "https://drive.google.com/file/d/1rsY8yx-kAp16y1qR___aapPTzsDuFa03/view?usp=sharing"
          },
          {
            "label": "Set 10",
            "url": "https://drive.google.com/file/d/1P-AwoiEajG5D2sF5l_Jr6P1BK9EVyUC-/view?usp=sharing"
          },
          {
            "label": "Set 11",
            "url": "https://drive.google.com/file/d/16Ywnphicu3-spzRmonC3_28emUiu3vCc/view?usp=sharing"
          },
          {
            "label": "Set 12",
            "url": "https://drive.google.com/file/d/1lKFHTtCTo3dyl3EUsFsfE-Q57LcedukF/view?usp=sharing"
          },
          {
            "label": "Set 13",
            "url": "https://drive.google.com/file/d/1JnG5-EWgChfjMrMmXbB4fwd5BW5upF7I/view?usp=sharing"
          }
        ]
      }
    ]
  },
  "social": {
    "subjectKey": "social",
    "subjectName": "Social Science",
    "icon": "globe",
    "color": "#0D9488",
    "bg": "#F0FDFA",
    "sections": [
      {
        "id": "board-exams",
        "title": "Board & Annual Examinations",
        "cardsCount": 5,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "social-board-exams-2026-0",
            "year": "2026",
            "title": "2026 Annual Board Exam - Sociology",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/10L8WP8VxsesYMKh2eKSdXBaopHRNxV-J/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1FrZTnCUXyONXqlJYLJpxAk0XVPQeYZVS/view?usp=sharing"
              }
            ]
          },
          {
            "id": "social-board-exams-2025-1",
            "year": "2025",
            "title": "2025 Annual Board Exam - Sociology",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1Zz_1G9XdwOoa9tUo2tLrLXEOZx643hxM/view?usp=sharing"
              }
            ]
          },
          {
            "id": "social-board-exams-2024-2",
            "year": "2024",
            "title": "2024 Annual Board Exam - Sociology",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1EA6In2e-YQJTwjJ3XNlnXM2jhiCOTV0e/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1tdhqbSHGOkaDP3GapO0ksA0GCSfWtEOU/view?usp=sharing"
              }
            ]
          },
          {
            "id": "social-board-exams-2023-3",
            "year": "2023",
            "title": "2023 Annual Board Exam - Sociology",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1sOWIeFmn9C6wiAFbkm0Ma48SnuYbGuaY/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1zskwNXkr_n15_mSrfOgH7TmHe7sMyYFA/view?usp=sharing"
              }
            ]
          },
          {
            "id": "social-board-exams-2022-4",
            "year": "2022",
            "title": "2022 Annual Board Exam - Sociology",
            "sectionId": "board-exams",
            "links": [
              {
                "type": "qp",
                "label": "Question Paper",
                "url": "https://drive.google.com/file/d/1h6SrZnUZLRbu2BooQIxmQMG12f5KH-6j/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1Etm57na1QFfzDVwXBv-yPcg5qrdQ7g9V/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "model-exams",
        "title": "Model Examinations",
        "cardsCount": 2,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "social-model-exams-2025-0",
            "year": "2025",
            "title": "2025 Model Exam - Sociology",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1kI44el6SAGAo588ZwHMMawdwN1bgsMg0/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1j5poT8A2kT2EMQdw3wfFBkBN-2wlIIwt/view?usp=sharing"
              }
            ]
          },
          {
            "id": "social-model-exams-2024-1",
            "year": "2024",
            "title": "2024 Model Exam - Sociology",
            "sectionId": "model-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1OiycpPNuaXxe-RQL5MwymnZt0Bq6MnmZ/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1aZlhDzd6knYbsZp5zhCQuIg3vIv2qbZk/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Key (Ashref Sir)",
                "url": "https://drive.google.com/file/d/1RLMUoSEbktcNU-_WwczWAj7eTSWoJ0-S/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "terminal-exams",
        "title": "Terminal Examinations (Onam & Christmas)",
        "cardsCount": 1,
        "practiceSetsCount": 0,
        "cards": [
          {
            "id": "social-terminal-exams-2024-0",
            "year": "2024",
            "title": "Second Term (Christmas) Exam 2024",
            "sectionId": "terminal-exams",
            "links": [
              {
                "type": "qp",
                "label": "QP (English Med)",
                "url": "https://drive.google.com/file/d/1A25xzc3NIVcDX7h9DlNRTdOVWn3LwBqk/view?usp=sharing"
              },
              {
                "type": "qp",
                "label": "QP (Malayalam Med)",
                "url": "https://drive.google.com/file/d/1WHC3SFrr-xQCZBTEIXEY_G8v9OlTMhO2/view?usp=sharing"
              },
              {
                "type": "key",
                "label": "Answer Key",
                "url": "https://drive.google.com/file/d/1PPxhV0e87rRjdC0_VZsBoLUj4P5_7hBE/view?usp=sharing"
              }
            ]
          }
        ],
        "practiceSets": []
      },
      {
        "id": "practice-sets",
        "title": "Model Practice Question Paper Sets",
        "cardsCount": 0,
        "practiceSetsCount": 6,
        "cards": [],
        "practiceSets": [
          {
            "label": "Set 1",
            "url": "https://drive.google.com/file/d/1q7YwNyT82Tn08umXZjM1q1LyS91PlPEF/view?usp=sharing"
          },
          {
            "label": "Set 2",
            "url": "https://drive.google.com/file/d/10rWyRogeG_oEpJSe7-_52ERITSa8tONu/view?usp=sharing"
          },
          {
            "label": "Set 3",
            "url": "https://drive.google.com/file/d/1Wu5GZMx00oBQUaW9oqtSKpL0wrbJwN_i/view?usp=sharing"
          },
          {
            "label": "Set 4",
            "url": "https://drive.google.com/file/d/1HnXv3LbTXqGNeH3c2hPArV03YgBaK1wG/view?usp=sharing"
          },
          {
            "label": "Set 5",
            "url": "https://drive.google.com/file/d/1hczz61VrxPJLX-8hJsPOgH_rzMYw9kia/view?usp=sharing"
          },
          {
            "label": "Set 6",
            "url": "https://drive.google.com/file/d/1QDFrzdvwviad4qR774Z2oyAD3pHq1ukh/view?usp=sharing"
          }
        ]
      }
    ]
  }
};

export const CLASS_12_SUBJECTS_LIST = Object.values(CLASS_12_PYQ_DATA).map((s) => ({
  key: s.subjectKey,
  name: s.subjectName,
  icon: s.icon,
  color: s.color,
  bg: s.bg,
  papersCount: s.sections.reduce((acc, sec) => acc + sec.cardsCount + sec.practiceSetsCount, 0),
}));
