from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.models import CurrentSession
from app.services.file_service import save_uploaded_file, cleanup_file
from app.services.calculation_service import calculate_all_scores

router = APIRouter()

class StudentInfo(BaseModel):
    firstname: str
    lastname: str
    age_years: int
    age_months: int
    school: str

@router.post("/student-info")
async def save_student_info(student_info: StudentInfo, db: Session = Depends(get_db)):
    # Clear any existing session
    db.query(CurrentSession).delete()
    
    # Create new session
    session = CurrentSession(
        student_firstname=student_info.firstname,
        student_lastname=student_info.lastname,
        age_years=student_info.age_years,
        age_months=student_info.age_months,
        school=student_info.school
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {"message": "Student information saved", "session_id": session.id}

@router.post("/upload-worksheet/{test_type}")
async def upload_worksheet(
    test_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process worksheet image (oral or listening)."""
    if test_type not in ["oral", "listening"]:
        raise HTTPException(status_code=400, detail="test_type must be 'oral' or 'listening'")
    
    # Check if session exists
    session = db.query(CurrentSession).first()
    if not session:
        raise HTTPException(status_code=400, detail="No active session. Please enter student info first.")
    
    try:
        # Save uploaded file
        file_path = save_uploaded_file(file, test_type)
        
        # For now, just simulate OCR processing with dummy data
        dummy_responses = {
            "A1": "+",
            "A2": "-",
            "A3": "+",
            "A4": "-"
        }
        
        # Update session with responses
        if test_type == "oral":
            session.oral_responses = dummy_responses
        else:
            session.listening_responses = dummy_responses
        
        db.commit()
        
        # Clean up uploaded file
        cleanup_file(file_path)
        
        return {
            "message": f"{test_type.title()} worksheet uploaded successfully",
            "responses": dummy_responses,
            "total_positives": sum(1 for r in dummy_responses.values() if r == '+'),
            "total_negatives": sum(1 for r in dummy_responses.values() if r == '-')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/calculate-scores")
async def calculate_scores_endpoint(db: Session = Depends(get_db)):
    """Calculate all scores for the current session."""
    session = db.query(CurrentSession).first()
    if not session:
        raise HTTPException(status_code=400, detail="No active session found")
    
    try:
        scores = calculate_all_scores(db, session)
        
        # Update session with calculated scores
        session.listening_raw_score = scores["listening_raw_score"]
        session.listening_standard_score = scores["listening_standard_score"]
        session.listening_percentile_rank = scores["listening_percentile_rank"]
        session.oral_raw_score = scores["oral_raw_score"]
        session.oral_standard_score = scores["oral_standard_score"]
        session.oral_percentile_rank = scores["oral_percentile_rank"]
        session.composite_standard_score = scores["composite_standard_score"]
        session.composite_percentile_rank = scores["composite_percentile_rank"]
        
        db.commit()
        
        return {
            "listening_scores": {
                "raw_score": scores["listening_raw_score"],
                "standard_score": scores["listening_standard_score"],
                "percentile_rank": scores["listening_percentile_rank"]
            },
            "oral_scores": {
                "raw_score": scores["oral_raw_score"],
                "standard_score": scores["oral_standard_score"],
                "percentile_rank": scores["oral_percentile_rank"]
            },
            "composite_scores": {
                "standard_score": scores["composite_standard_score"],
                "percentile_rank": scores["composite_percentile_rank"],
                "sum_standard_scores": scores["sum_standard_scores"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating scores: {str(e)}")

@router.get("/session-status")
async def get_session_status(db: Session = Depends(get_db)):
    session = db.query(CurrentSession).first()
    
    if not session:
        return {"session_exists": False}
    
    return {
        "session_exists": True,
        "student_name": f"{session.student_firstname} {session.student_lastname}",
        "age": f"{session.age_years}y {session.age_months}m",
        "school": session.school,
        "oral_uploaded": session.oral_responses is not None,
        "listening_uploaded": session.listening_responses is not None,
        "scores_calculated": session.listening_standard_score is not None
    }