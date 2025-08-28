from sqlalchemy.orm import Session
from app.models.models import TableA1LC, TableA1OE, TableA2, EvaluationResponse, Task, TestType, Category
from typing import Dict, List, Tuple, Optional

def calculate_scores_for_evaluation(db: Session, evaluation_id: int) -> Dict:
    """Calculate all scores for an evaluation."""
    
    # Get all responses for this evaluation with joined task, test_type, and category data
    responses = db.query(EvaluationResponse).filter(
        EvaluationResponse.evaluation_id == evaluation_id
    ).join(Task).join(TestType).join(Category).all()
    
    # Separate by test type and count correct responses
    listening_correct = 0
    oral_correct = 0
    listening_strengths = []
    listening_weaknesses = []
    oral_strengths = []
    oral_weaknesses = []
    
    for response in responses:
        if response.task.test_type.name == "listening":
            if response.response.value == "correct":
                listening_correct += 1
                listening_strengths.append(response.task.task_description)
            else:
                listening_weaknesses.append(response.task.task_description)
        elif response.task.test_type.name == "oral":
            if response.response.value == "correct":
                oral_correct += 1
                oral_strengths.append(response.task.task_description)
            else:
                oral_weaknesses.append(response.task.task_description)
    
    # Get evaluation details for age lookup
    evaluation = db.query(EvaluationResponse).filter(
        EvaluationResponse.evaluation_id == evaluation_id
    ).first().evaluation
    
    # Look up standard scores and percentile ranks
    listening_standard, listening_percentile = lookup_scores(
        db, listening_correct, evaluation.age_years, evaluation.age_months, "listening"
    )
    oral_standard, oral_percentile = lookup_scores(
        db, oral_correct, evaluation.age_years, evaluation.age_months, "oral"
    )
    
    # Calculate composite
    composite_standard = None
    composite_percentile = None
    sum_standard_scores = None
    if listening_standard and oral_standard:
        sum_standard_scores = listening_standard + oral_standard
        composite_standard, composite_percentile = lookup_composite_score(db, sum_standard_scores)
    
    return {
        "listening_raw_score": listening_correct,
        "listening_standard_score": listening_standard,
        "listening_percentile_rank": listening_percentile,
        "oral_raw_score": oral_correct,
        "oral_standard_score": oral_standard,
        "oral_percentile_rank": oral_percentile,
        "composite_standard_score": composite_standard,
        "composite_percentile_rank": composite_percentile,
        "sum_standard_scores": sum_standard_scores,
        "listening_strengths": listening_strengths,
        "listening_weaknesses": listening_weaknesses,
        "oral_strengths": oral_strengths,
        "oral_weaknesses": oral_weaknesses
    }

def lookup_scores(db: Session, raw_score: int, age_years: int, age_months: int, test_type: str) -> Tuple[Optional[int], Optional[str]]:
    """Look up standard score and percentile rank from database."""
    if test_type == "listening":
        score_record = db.query(TableA1LC).filter(
            TableA1LC.age_years == age_years,
            TableA1LC.age_months == age_months,
            TableA1LC.raw_score == raw_score
        ).first()
    elif test_type == "oral":
        score_record = db.query(TableA1OE).filter(
            TableA1OE.age_years == age_years,
            TableA1OE.age_months == age_months,
            TableA1OE.raw_score == raw_score
        ).first()
    else:
        return None, None
    
    if score_record:
        return score_record.standard_score, score_record.percentile_rank
    else:
        return None, None

def lookup_composite_score(db: Session, sum_standard_scores: int) -> Tuple[Optional[int], Optional[str]]:
    """Look up composite score from sum of standard scores."""
    composite_record = db.query(TableA2).filter(
        TableA2.sum_standard_scores == sum_standard_scores
    ).first()
    
    if composite_record:
        return composite_record.composite_standard_score, composite_record.composite_percentile_rank
    else:
        return None, None