from sqlalchemy.orm import sessionmaker
from app.database.connection import engine, Base
from app.models.models import User, Task, CurrentSession, ListeningScore, OralScore, CompositeScore
from app.services.auth_service import get_password_hash

Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Create admin user if doesn't exist
    existing_user = db.query(User).filter(User.username == "admin").first()
    if not existing_user:
        admin_user = User(
            username="admin",
            password_hash=get_password_hash("admin123")
        )
        db.add(admin_user)
        print("Created admin user")

    # Add sample tasks
    existing_tasks = db.query(Task).count()
    if existing_tasks == 0:
        sample_tasks = [
            Task(test_type="listening", item="A1", category="Lexical/Semantic", task_description="vocabulary (nouns—word, letter)"),
            Task(test_type="listening", item="A2", category="Syntactic", task_description="compound subjects"),
            Task(test_type="oral", item="A1", category="Lexical/Semantic", task_description="noun phrases"),
            Task(test_type="oral", item="A2", category="Lexical/Semantic", task_description="adjectives (ex: three)"),
        ]
        for task in sample_tasks:
            db.add(task)
        print("Added sample tasks")

    # Clear existing scores
    db.query(ListeningScore).delete()
    db.query(OralScore).delete()
    db.query(CompositeScore).delete()

    # Add COMPLETE LC scores for ages 6-3 to 6-5 
    listening_scores = [
        # High end
        ListeningScore(age_years=6, age_months=3, raw_score=130, standard_score=160, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=129, standard_score=160, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=128, standard_score=160, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=127, standard_score=160, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=126, standard_score=160, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=125, standard_score=160, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=124, standard_score=159, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=123, standard_score=158, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=122, standard_score=157, percentile_rank=99),
        ListeningScore(age_years=6, age_months=3, raw_score=121, standard_score=156, percentile_rank=99),
        # Low end
        ListeningScore(age_years=6, age_months=3, raw_score=10, standard_score=44, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=9, standard_score=43, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=8, standard_score=42, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=7, standard_score=41, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=6, standard_score=40, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=5, standard_score=40, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=4, standard_score=40, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=3, standard_score=40, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=2, standard_score=40, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=1, standard_score=40, percentile_rank=0),
        ListeningScore(age_years=6, age_months=3, raw_score=0, standard_score=40, percentile_rank=0),
    ]

    # Add COMPLETE OE scores for ages 6-3 to 6-5
    oral_scores = [
        # High end
        OralScore(age_years=6, age_months=3, raw_score=106, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=105, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=104, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=103, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=102, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=101, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=100, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=99, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=98, standard_score=160, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=97, standard_score=159, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=96, standard_score=158, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=95, standard_score=157, percentile_rank=99),
        OralScore(age_years=6, age_months=3, raw_score=94, standard_score=156, percentile_rank=99),
        # Low end
        OralScore(age_years=6, age_months=3, raw_score=7, standard_score=46, percentile_rank=0),
        OralScore(age_years=6, age_months=3, raw_score=6, standard_score=44, percentile_rank=0),
        OralScore(age_years=6, age_months=3, raw_score=5, standard_score=43, percentile_rank=0),
        OralScore(age_years=6, age_months=3, raw_score=4, standard_score=42, percentile_rank=0),
        OralScore(age_years=6, age_months=3, raw_score=3, standard_score=40, percentile_rank=0),
        OralScore(age_years=6, age_months=3, raw_score=2, standard_score=40, percentile_rank=0),
        OralScore(age_years=6, age_months=3, raw_score=1, standard_score=40, percentile_rank=0),
        OralScore(age_years=6, age_months=3, raw_score=0, standard_score=40, percentile_rank=0),
    ]

    # Add composite scores (Table A2 data)
    composite_scores = [
        # High end
        CompositeScore(sum_standard_scores=320, composite_standard_score=160, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=319, composite_standard_score=160, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=318, composite_standard_score=160, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=317, composite_standard_score=160, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=316, composite_standard_score=159, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=315, composite_standard_score=158, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=314, composite_standard_score=158, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=313, composite_standard_score=157, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=312, composite_standard_score=157, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=311, composite_standard_score=156, composite_percentile_rank=99),
        CompositeScore(sum_standard_scores=310, composite_standard_score=156, composite_percentile_rank=99),
        
        # Lower end data
        CompositeScore(sum_standard_scores=141, composite_standard_score=68, composite_percentile_rank=2),
        CompositeScore(sum_standard_scores=140, composite_standard_score=68, composite_percentile_rank=2),
        CompositeScore(sum_standard_scores=139, composite_standard_score=67, composite_percentile_rank=1),
        CompositeScore(sum_standard_scores=138, composite_standard_score=67, composite_percentile_rank=1),
        CompositeScore(sum_standard_scores=137, composite_standard_score=66, composite_percentile_rank=1),
        CompositeScore(sum_standard_scores=136, composite_standard_score=66, composite_percentile_rank=1),
        CompositeScore(sum_standard_scores=135, composite_standard_score=65, composite_percentile_rank=1),
        CompositeScore(sum_standard_scores=134, composite_standard_score=65, composite_percentile_rank=1),
        CompositeScore(sum_standard_scores=133, composite_standard_score=64, composite_percentile_rank=1),
        CompositeScore(sum_standard_scores=132, composite_standard_score=64, composite_percentile_rank=1),
        # Add score for 80 (40+40)
        CompositeScore(sum_standard_scores=80, composite_standard_score=40, composite_percentile_rank=0),
    ]

    for score in listening_scores:
        db.add(score)
    for score in oral_scores:
        db.add(score)
    for score in composite_scores:
        db.add(score)

    db.commit()
    print("Database initialized with correct OWLS-II scores!")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()