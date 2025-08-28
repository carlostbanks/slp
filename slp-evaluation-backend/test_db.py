from app.database.connection import engine, Base
from app.models.models import User, Task

# Test database connection
try:
    Base.metadata.create_all(bind=engine)
    print("Database connected successfully!")
    print("Tables created")
except Exception as e:
    print(f"Database connection failed: {e}")