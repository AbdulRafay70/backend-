
import zipfile
import xml.etree.ElementTree as ET
import glob
import os

def docx_to_text(docx_path, output_path):
    print(f"Attempting to extract text from: {docx_path}")
    try:
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        with zipfile.ZipFile(docx_path) as document:
            xml_content = document.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            text_parts = []
            for node in tree.iter(f'{{{ns["w"]}}}p'):
                texts = [node.text for node in node.iter(f'{{{ns["w"]}}}t') if node.text]
                if texts:
                    text_parts.append(''.join(texts))
            
            full_text = '\n\n'.join(text_parts)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(f"# Extracted Requirements from {os.path.basename(docx_path)}\n\n")
                f.write(full_text)
                
            print(f"Successfully converted to {output_path}")
            return True
            
    except Exception as e:
        print(f"Error extracting text: {e}")
        return False

# Find the file (handling case sensitivity and potential naming variations)
search_pattern = "SAER.PK*.docx"
files = glob.glob(search_pattern)

if not files:
    # Try the user provided name variation
    files = glob.glob("saer pk.docx")

if files:
    target_file = files[0]
    output_file = "requirements_extracted.md"
    docx_to_text(target_file, output_file)
else:
    print("Could not find requirements docx file.")
