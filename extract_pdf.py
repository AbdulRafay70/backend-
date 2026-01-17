"""
Extract and save Kuickpay API documentation from PDF
"""
import PyPDF2

# Read PDF
pdf_path = r'E:\New folder\Kuickpay BPS-Rest Based Document V3.pdf'
with open(pdf_path, 'rb') as pdf_file:
    reader = PyPDF2.PdfReader(pdf_file)
    
    # Extract all text
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n\n"
    
    # Save to file
    output_path = r'e:\New folder\backend\docs\kuickpay_official_api_extracted.txt'
    with open(output_path, 'w', encoding='utf-8') as output_file:
        output_file.write(full_text)
    
    print(f"Extracted {len(reader.pages)} pages")
    print(f"Saved to: {output_path}")
    print(f"Total characters: {len(full_text)}")
