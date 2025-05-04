from pydantic import BaseModel
from typing import List, Dict, Any

# Define request and response models
class Session(BaseModel):
    numSession: str  # Matches "numSession" in the JSON
    day: str         # Matches "day" in the JSON
    date: str        # Matches "date" in the JSON
    maxSupervisor: int  # Matches "maxSupervisor" in the JSON
    delay: float     # Matches "delay" in the JSON
    responsibleName: List[str]  # Matches "responsibleName" in the JSON
    type: str = "DS"  # Default value for type

class Teacher(BaseModel):
    fullName: str  # Matches "fullname" in the JSON
    grade: str     # Matches "grade" in the JSON
    hourlyLoad: float  # Matches "hourlyLoad" in the JSON

class ScheduleRequest(BaseModel):
    sessions: List[Session]
    teachers: List[Teacher]