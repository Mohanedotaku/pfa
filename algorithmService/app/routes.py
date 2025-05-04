from fastapi import APIRouter
from app.models import ScheduleRequest
from algorithms.heuristic import schedule_surveillance
from algorithms.genetic import run_genetic_algorithm

# Initialize router
schedule_router = APIRouter()

@schedule_router.post("/schedule")
def generate_schedule(request: ScheduleRequest):
    sessions_data = [
        {
            "type": "DS",
            "numSession": session.numSession,
            "day": session.day,
            "date": session.date,
            "maxSupervisor": session.maxSupervisor,
            "delay": session.delay,
            "responsibleName": session.responsibleName
        }
        for session in request.sessions
    ]

    teachers_data = [
        {
            "fullname": teacher.fullName,
            "grade": teacher.grade,
            "hourlyLoad": teacher.hourlyLoad
        }
        for teacher in request.teachers
    ]

    # Run heuristic algorithm
    heuristic_sessions, _, heuristic_warnings = schedule_surveillance(sessions_data, teachers_data)

    # Run genetic algorithm
    teacher_schedule = run_genetic_algorithm(heuristic_sessions, sessions_data, teachers_data)

    return teacher_schedule