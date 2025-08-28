from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    test_type = Column(String(20), nullable=False)
    item = Column(String(10), nullable=False)
    category = Column(String(50), nullable=False)
    task_description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

class ListeningScore(Base):
    __tablename__ = "listening_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    age_years = Column(Integer, nullable=False)
    age_months = Column(Integer, nullable=False)
    raw_score = Column(Integer, nullable=False)
    standard_score = Column(Integer, nullable=False)
    percentile_rank = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())

class OralScore(Base):
    __tablename__ = "oral_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    age_years = Column(Integer, nullable=False)
    age_months = Column(Integer, nullable=False)
    raw_score = Column(Integer, nullable=False)
    standard_score = Column(Integer, nullable=False)
    percentile_rank = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())

class CompositeScore(Base):
    __tablename__ = "composite_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    sum_standard_scores = Column(Integer, nullable=False)
    composite_standard_score = Column(Integer, nullable=False)
    composite_percentile_rank = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())

class CurrentSession(Base):
    __tablename__ = "current_session"
    
    id = Column(Integer, primary_key=True, index=True)
    student_firstname = Column(String(100), nullable=False)
    student_lastname = Column(String(100), nullable=False)
    age_years = Column(Integer, nullable=False)
    age_months = Column(Integer, nullable=False)
    school = Column(String(200), nullable=False)
    oral_responses = Column(JSON)
    listening_responses = Column(JSON)
    listening_raw_score = Column(Integer)
    listening_standard_score = Column(Integer)
    listening_percentile_rank = Column(Integer)
    oral_raw_score = Column(Integer)
    oral_standard_score = Column(Integer)
    oral_percentile_rank = Column(Integer)
    composite_standard_score = Column(Integer)
    composite_percentile_rank = Column(Integer)
    created_at = Column(DateTime, default=func.now())