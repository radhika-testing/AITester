"""PDF parsing service for test plan templates."""
from pypdf import PdfReader
from io import BytesIO
from typing import Optional


class PDFParser:
    """Parse PDF files and extract text content."""
    
    @staticmethod
    def parse_pdf(file_content: bytes) -> str:
        """Extract text from PDF bytes."""
        try:
            pdf_file = BytesIO(file_content)
            reader = PdfReader(pdf_file)
            
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            
            return "\n\n".join(text_parts)
        except Exception as e:
            raise Exception(f"Failed to parse PDF: {e}")
    
    @staticmethod
    def extract_structure(text: str) -> str:
        """Extract structure/template from PDF text."""
        lines = text.split("\n")
        
        # Look for common section headers
        sections = []
        current_section = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line looks like a header
            is_header = (
                line.isupper() or
                line.endswith(":") or
                line.lower() in [
                    "test plan", "test cases", "preconditions", 
                    "test steps", "expected results", "test scenario"
                ]
            )
            
            if is_header:
                if current_section:
                    sections.append("\n".join(current_section))
                current_section = [line]
            else:
                current_section.append(line)
        
        if current_section:
            sections.append("\n".join(current_section))
        
        return "\n\n".join(sections) if sections else text


def parse_template(file_content: bytes) -> str:
    """Parse a PDF template file and extract its structure."""
    raw_text = PDFParser.parse_pdf(file_content)
    return PDFParser.extract_structure(raw_text)
