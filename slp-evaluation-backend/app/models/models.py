from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum

class TestTypeEnum(enum.Enum):
    ORAL = "oral"
    LISTENING = "listening"

class ResponseEnum(enum.Enum):
    CORRECT = "correct" 
    INCORRECT = "incorrect"

class StatusEnum(enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=func.now())

class TestType(Base):
    __tablename__ = "test_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime, default=func.now())

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    test_type_id = Column(Integer, ForeignKey("test_types.id"), nullable=False)
    item = Column(String(10), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    task_description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    test_type = relationship("TestType")
    category = relationship("Category")

class TableA1LC(Base):
    __tablename__ = "table_a1_lc"
    
    id = Column(Integer, primary_key=True, index=True)
    age_years = Column(Integer, nullable=False)
    age_months = Column(Integer, nullable=False)
    raw_score = Column(Integer, nullable=False)
    standard_score = Column(Integer, nullable=False)
    percentile_rank = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=func.now())

class TableA1OE(Base):
    __tablename__ = "table_a1_oe"
    
    id = Column(Integer, primary_key=True, index=True)
    age_years = Column(Integer, nullable=False)
    age_months = Column(Integer, nullable=False)
    raw_score = Column(Integer, nullable=False)
    standard_score = Column(Integer, nullable=False)
    percentile_rank = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=func.now())

class TableA2(Base):
    __tablename__ = "table_a2"
    
    id = Column(Integer, primary_key=True, index=True)
    sum_standard_scores = Column(Integer, nullable=False)
    composite_standard_score = Column(Integer, nullable=False)
    composite_percentile_rank = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=func.now())

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    student_firstname = Column(String(100), nullable=False)
    student_lastname = Column(String(100), nullable=False)
    age_years = Column(Integer, nullable=False)
    age_months = Column(Integer, nullable=False)
    school = Column(String(200), nullable=False)
    status = Column(Enum(StatusEnum), default=StatusEnum.IN_PROGRESS)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    
    responses = relationship("EvaluationResponse", back_populates="evaluation")

class EvaluationResponse(Base):
    __tablename__ = "evaluation_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    response = Column(Enum(ResponseEnum), nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    evaluation = relationship("Evaluation", back_populates="responses")
    task = relationship("Task")