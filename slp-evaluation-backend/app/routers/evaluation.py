from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db
from app.models.models import Evaluation, EvaluationResponse, Task, TestType, Category, ResponseEnum, StatusEnum
from app.services.calculation_service import calculate_scores_for_evaluation

router = APIRouter()

class StudentInfo(BaseModel):
    firstname: str
    lastname: str
    age_years: int
    age_months: int
    school: str

class EvaluationCreate(BaseModel):
    student_info: StudentInfo

class ResponseUpdate(BaseModel):
    task_id: int
    response: str  # 'correct' or 'incorrect'

@router.get("/dashboard")
async def get_evaluations(db: Session = Depends(get_db)):
    """Get all evaluations for dashboard."""
    evaluations = db.query(Evaluation).order_by(Evaluation.created_at.desc()).all()
    
    return [
        {
            "id": eval.id,
            "student_name": f"{eval.student_firstname} {eval.student_lastname}",
            "school": eval.school,
            "date": eval.created_at.strftime("%Y-%m-%d"),
            "status": eval.status.value
        }
        for eval in evaluations
    ]

@router.post("/create")
async def create_evaluation(eval_data: EvaluationCreate, db: Session = Depends(get_db)):
    """Create new evaluation."""
    evaluation = Evaluation(
        student_firstname=eval_data.student_info.firstname,
        student_lastname=eval_data.student_info.lastname,
        age_years=eval_data.student_info.age_years,
        age_months=eval_data.student_info.age_months,
        school=eval_data.student_info.school
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    return {"evaluation_id": evaluation.id, "message": "Evaluation created successfully"}

@router.get("/test/{evaluation_id}")
async def get_evaluation_test(evaluation_id: int, db: Session = Depends(get_db)):
    """Get evaluation details and tasks for testing interface."""
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    # Get all tasks with joined test_type and category data
    tasks = db.query(Task).join(TestType).join(Category).order_by(TestType.name, Task.item).all()
    
    # Get existing responses
    responses = db.query(EvaluationResponse).filter(
        EvaluationResponse.evaluation_id == evaluation_id
    ).all()
    
    # Create response lookup
    response_lookup = {resp.task_id: resp.response.value for resp in responses}
    
    # Group tasks by test type
    oral_tasks = []
    listening_tasks = []
    
    for task in tasks:
        task_data = {
            "id": task.id,
            "item": task.item,
            "category": task.category.name,
            "task_description": task.task_description,
            "response": response_lookup.get(task.id, "")
        }
        
        if task.test_type.name == "oral":
            oral_tasks.append(task_data)
        else:
            listening_tasks.append(task_data)
    
    return {
        "evaluation": {
            "id": evaluation.id,
            "student_name": f"{evaluation.student_firstname} {evaluation.student_lastname}",
            "age": f"{evaluation.age_years}y {evaluation.age_months}m",
            "school": evaluation.school,
            "status": evaluation.status.value
        },
        "oral_tasks": oral_tasks,
        "listening_tasks": listening_tasks
    }

@router.post("/test/{evaluation_id}/response")
async def save_response(evaluation_id: int, response_data: ResponseUpdate, db: Session = Depends(get_db)):
    """Save or update a response."""
    
    # Validate response value
    if response_data.response not in ["correct", "incorrect"]:
        raise HTTPException(status_code=400, detail="Response must be 'correct' or 'incorrect'")
    
    # Check if response exists
    existing = db.query(EvaluationResponse).filter(
        EvaluationResponse.evaluation_id == evaluation_id,
        EvaluationResponse.task_id == response_data.task_id
    ).first()
    
    response_enum = ResponseEnum.CORRECT if response_data.response == "correct" else ResponseEnum.INCORRECT
    
    if existing:
        existing.response = response_enum
    else:
        new_response = EvaluationResponse(
            evaluation_id=evaluation_id,
            task_id=response_data.task_id,
            response=response_enum
        )
        db.add(new_response)
    
    db.commit()
    return {"message": "Response saved"}

@router.post("/test/{evaluation_id}/calculate")
async def calculate_evaluation_scores(evaluation_id: int, db: Session = Depends(get_db)):
    """Calculate scores for evaluation."""
    
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    try:
        scores = calculate_scores_for_evaluation(db, evaluation_id)
        
        # Mark evaluation as completed
        evaluation.status = StatusEnum.COMPLETED
        evaluation.completed_at = datetime.utcnow()
        db.commit()
        
        return {
            "student_age": f"{evaluation.age_years}y {evaluation.age_months}m",
            "lc_scores": {
                "lc_raw_score": scores["listening_raw_score"],
                "lc_standard_score": scores["listening_standard_score"],
                "lc_percentile_rank": scores["listening_percentile_rank"]
            },
            "oe_scores": {
                "oe_raw_score": scores["oral_raw_score"],
                "oe_standard_score": scores["oral_standard_score"],
                "oe_percentile_rank": scores["oral_percentile_rank"]
            },
            "composite_scores": {
                "lc_standard_score": scores["listening_standard_score"],
                "oe_standard_score": scores["oral_standard_score"],
                "sum_standard_scores": scores["sum_standard_scores"],
                "composite_standard_score": scores["composite_standard_score"],
                "composite_percentile_rank": scores["composite_percentile_rank"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating scores: {str(e)}")