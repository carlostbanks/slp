import os
import uuid
from pathlib import Path
from fastapi import UploadFile
import shutil

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def save_uploaded_file(file: UploadFile, test_type: str) -> str:
    """
    Save uploaded file and return the file path.
    """
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else ""
    unique_filename = f"{test_type}_{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return str(file_path)

def cleanup_file(file_path: str):
    """Remove uploaded file after processing."""
    try:
        os.remove(file_path)
    except OSError:
        pass