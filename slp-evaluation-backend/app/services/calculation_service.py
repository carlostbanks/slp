from sqlalchemy.orm import Session
from app.models.models import ListeningScore, OralScore, CompositeScore
from typing import Dict, Tuple, Optional

def calculate_raw_score(responses: Dict[str, str]) -> int:
    """Calculate raw score from responses (count of + marks)."""
    return sum(1 for response in responses.values() if response == '+')

def lookup_scores(db: Session, raw_score: int, age_years: int, age_months: int, test_type: str) -> Tuple[Optional[int], Optional[int]]:
    """Look up standard score and percentile rank from database."""
    if test_type == "listening":
        score_record = db.query(ListeningScore).filter(
            ListeningScore.age_years == age_years,
            ListeningScore.age_months == age_months,
            ListeningScore.raw_score == raw_score
        ).first()
    elif test_type == "oral":
        score_record = db.query(OralScore).filter(
            OralScore.age_years == age_years,
            OralScore.age_months == age_months,
            OralScore.raw_score == raw_score
        ).first()
    else:
        return None, None
    
    if score_record:
        return score_record.standard_score, score_record.percentile_rank
    else:
        return None, None

def lookup_composite_score(db: Session, sum_standard_scores: int) -> Tuple[Optional[int], Optional[int]]:
    """Look up composite score from sum of standard scores."""
    composite_record = db.query(CompositeScore).filter(
        CompositeScore.sum_standard_scores == sum_standard_scores
    ).first()
    
    if composite_record:
        return composite_record.composite_standard_score, composite_record.composite_percentile_rank
    else:
        return None, None

def calculate_all_scores(db: Session, session) -> Dict:
    """Calculate all scores for a session."""
    if not session.oral_responses or not session.listening_responses:
        raise ValueError("Both oral and listening responses are required")
    
    # Calculate raw scores
    listening_raw = calculate_raw_score(session.listening_responses)
    oral_raw = calculate_raw_score(session.oral_responses)
    
    # Look up standard scores and percentile ranks
    listening_standard, listening_percentile = lookup_scores(
        db, listening_raw, session.age_years, session.age_months, "listening"
    )
    oral_standard, oral_percentile = lookup_scores(
        db, oral_raw, session.age_years, session.age_months, "oral"
    )
    
    # Calculate composite if both standard scores exist
    composite_standard = None
    composite_percentile = None
    if listening_standard is not None and oral_standard is not None:
        sum_standard_scores = listening_standard + oral_standard
        composite_standard, composite_percentile = lookup_composite_score(db, sum_standard_scores)
    
    return {
        "listening_raw_score": listening_raw,
        "listening_standard_score": listening_standard,
        "listening_percentile_rank": listening_percentile,
        "oral_raw_score": oral_raw,
        "oral_standard_score": oral_standard,
        "oral_percentile_rank": oral_percentile,
        "composite_standard_score": composite_standard,
        "composite_percentile_rank": composite_percentile,
        "sum_standard_scores": listening_standard + oral_standard if listening_standard and oral_standard else None
    }