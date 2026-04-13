"""
KEAM PDF Question Extractor
Pipeline:
  1. LlamaParse  → converts each PDF to clean Markdown (handles equations/tables well)
  2. Gemini text API → structures Markdown into our JSON question format

Requirements:
  pip install llama-parse llama-index-core google-genai pydantic
"""

import os
import sys
import json
import time

from llama_parse import LlamaParse
from google import genai
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────
#  API Keys
# ─────────────────────────────────────────────
GEMINI_API_KEY   = os.environ.get("GEMINI_API_KEY",   "")
LLAMAPARSE_KEY   = os.environ.get("LLAMA_CLOUD_API_KEY", "")

if not LLAMAPARSE_KEY:
    print("ERROR: Please provide your LlamaParse API key.")
    print("  Get a free key at https://cloud.llamaindex.ai")
    print("  Then set it below in this script or as the env var LLAMA_CLOUD_API_KEY")
    LLAMAPARSE_KEY = input("Paste your LlamaParse API key here: ").strip()
    if not LLAMAPARSE_KEY:
        sys.exit(1)

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# ─────────────────────────────────────────────
#  LlamaParse setup
# ─────────────────────────────────────────────
parser = LlamaParse(
    api_key=LLAMAPARSE_KEY,
    result_type="markdown",        # returns clean Markdown per page
    language="en",
    parsing_instruction=(
        "This is a KEAM Engineering Entrance Exam paper. "
        "Preserve all mathematical expressions exactly. "
        "Format equations using LaTeX notation where possible."
    ),
    skip_diagonal_text=True,
    do_not_unroll_columns=False,
)

# ─────────────────────────────────────────────
#  Pydantic schema for Gemini structured output
# ─────────────────────────────────────────────
class Option(BaseModel):
    id: str = Field(description="Option identifier: a, b, c, d, or e")
    text: str = Field(description="Option text with MathJax inline math \\( ... \\) where needed")

class Question(BaseModel):
    id: str = Field(description="Unique id e.g. q1, q2 ...")
    subject: str = Field(description="Mathematics, Physics, or Chemistry")
    topic: str = Field(description="Specific subtopic e.g. Kinematics, Calculus, Organic Chemistry")
    question: str = Field(description="Full question text. Use \\( ... \\) for inline math and \\[ ... \\] for block math")
    options: list[Option] = Field(description="All answer options (4 or 5)")
    correctOption: str = Field(description="id of correct option, or 'unknown'")
    explanation: str = Field(description="Brief step-by-step explanation with LaTeX math as needed")

class QuestionList(BaseModel):
    questions: list[Question]


def parse_pdf_to_markdown(pdf_path: str) -> str:
    """Use LlamaParse to convert a PDF to Markdown text."""
    print(f"  [LlamaParse] Uploading and parsing: {os.path.basename(pdf_path)}")
    documents = parser.load_data(pdf_path)
    # Concatenate all pages
    full_text = "\n\n".join(doc.text for doc in documents)
    return full_text


def structure_markdown_to_questions(markdown_text: str, pdf_name: str) -> list[dict]:
    """Send the Markdown text to Gemini and get back structured question JSON."""
    print(f"  [Gemini] Structuring {len(markdown_text)} chars of Markdown...")

    prompt = f"""
You are an expert KEAM exam parser.

Below is the raw Markdown text extracted from a KEAM Engineering Entrance Exam PDF.
Your task is to identify and extract EVERY question from it.

STRICT RULES:
1. Each question must have exactly the options listed in the PDF (usually 5 for older KEAM papers, 4 for newer ones).
2. Convert all math expressions to MathJax format:
   - Inline math: \\( ... \\)
   - Block/display math: \\[ ... \\]
3. Identify the subject (Mathematics, Physics, Chemistry) and a specific topic for each question.
4. If an answer key is present at the end, use it to set correctOption. Otherwise set it to 'unknown'.
5. Write a brief explanation for each answer if you can determine it.
6. Output ONLY valid JSON matching the schema. No extra commentary.

---DOCUMENT START---
{markdown_text[:30000]}
---DOCUMENT END---
"""

    for attempt in range(5):
        try:
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt],
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': QuestionList,
                    'temperature': 0.1,
                }
            )
            data = json.loads(response.text)
            questions = data.get("questions", [])
            print(f"  [Gemini] Extracted {len(questions)} questions from {pdf_name}")
            return questions
        except Exception as e:
            print(f"  [Gemini] Attempt {attempt+1}/5 failed: {e}")
            if attempt < 4:
                print(f"  Retrying in 20 seconds...")
                time.sleep(20)
            else:
                print(f"  Giving up on {pdf_name}.")
                return []


def build_database(pdf_folder: str, output_json: str = "scraped_keam_questions.json"):
    print(f"\n{'='*60}")
    print(f"KEAM PDF -> Question Extractor")
    print(f"Folder : {pdf_folder}")
    print(f"Output : {output_json}")
    print(f"{'='*60}\n")

    # Resume from existing database
    db = []
    processed_files = set()
    if os.path.exists(output_json):
        try:
            with open(output_json, 'r', encoding='utf-8') as f:
                saved = json.load(f)
                db = saved.get("questions", [])
                processed_files = set(saved.get("processed_files", []))
            print(f"Resuming: {len(processed_files)} PDFs already done, {len(db)} questions in DB.\n")
        except Exception:
            pass

    pdf_files = sorted(f for f in os.listdir(pdf_folder) if f.endswith('.pdf'))
    remaining  = [f for f in pdf_files if f not in processed_files]
    print(f"Total PDFs: {len(pdf_files)} | Done: {len(processed_files)} | Remaining: {len(remaining)}\n")

    for i, pdf_file in enumerate(remaining):
        pdf_path = os.path.join(pdf_folder, pdf_file)
        print(f"[{i+1}/{len(remaining)}] Processing: {pdf_file}")

        try:
            # Step 1: LlamaParse → Markdown
            markdown = parse_pdf_to_markdown(pdf_path)
            if not markdown.strip():
                print(f"  WARNING: Got empty Markdown from {pdf_file}, skipping.")
                processed_files.add(pdf_file)
                continue

            # Step 2: Gemini → JSON
            questions = structure_markdown_to_questions(markdown, pdf_file)

            # Step 3: Save progress
            db.extend(questions)
            processed_files.add(pdf_file)

            with open(output_json, 'w', encoding='utf-8') as f:
                json.dump({
                    "processed_files": list(processed_files),
                    "total_questions": len(db),
                    "questions": db,
                }, f, indent=2, ensure_ascii=False)

            print(f"  ✓ Done. DB total: {len(db)} questions\n")
            time.sleep(5)   # gentle pause between PDFs

        except Exception as e:
            print(f"  ERROR with {pdf_file}: {e}")
            print("  Skipping to next PDF...\n")
            time.sleep(10)
            continue

    print(f"\n{'='*60}")
    print(f"COMPLETE! Total questions extracted: {len(db)}")
    print(f"Saved to: {output_json}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    FOLDER = r"c:\Users\madhu\code_test\keam previous year question papers"
    build_database(FOLDER)
