from sqlalchemy.orm import sessionmaker
from app.database.connection import engine, Base
from app.models.models import User, Category, TestType, Task
from app.services.auth_service import get_password_hash

Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Create admin user
    existing_user = db.query(User).filter(User.username == "admin").first()
    if not existing_user:
        admin_user = User(
            username="admin",
            password_hash=get_password_hash("admin123")
        )
        db.add(admin_user)
        print("Created admin user")

    # Create categories
    categories = ["Lexical/Semantic", "Syntactic", "Supralinguistic", "Pragmatic"]
    for cat_name in categories:
        existing_cat = db.query(Category).filter(Category.name == cat_name).first()
        if not existing_cat:
            category = Category(name=cat_name)
            db.add(category)
            print(f"Created category: {cat_name}")

    # Create test types
    test_types = ["oral", "listening"]
    for tt_name in test_types:
        existing_tt = db.query(TestType).filter(TestType.name == tt_name).first()
        if not existing_tt:
            test_type = TestType(name=tt_name)
            db.add(test_type)
            print(f"Created test type: {tt_name}")

    db.commit()

    # Get IDs for foreign key references
    lexical_semantic_id = db.query(Category).filter(Category.name == "Lexical/Semantic").first().id
    syntactic_id = db.query(Category).filter(Category.name == "Syntactic").first().id
    oral_id = db.query(TestType).filter(TestType.name == "oral").first().id
    listening_id = db.query(TestType).filter(TestType.name == "listening").first().id

    # Clear existing tasks and add sample tasks with proper foreign keys
    db.query(Task).delete()
    
    sample_tasks = [
        Task(test_type_id=listening_id, item="A1", category_id=lexical_semantic_id, task_description="vocabulary (nouns—word, letter)"),
        Task(test_type_id=listening_id, item="A2", category_id=syntactic_id, task_description="compound subjects"),
        Task(test_type_id=oral_id, item="A1", category_id=lexical_semantic_id, task_description="noun phrases"),
        Task(test_type_id=oral_id, item="A2", category_id=lexical_semantic_id, task_description="adjectives (ex: three)"),
    ]
    
    for task in sample_tasks:
        db.add(task)
    print("Added sample tasks with proper foreign key references")

    db.commit()
    print("Database structure updated successfully!")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()