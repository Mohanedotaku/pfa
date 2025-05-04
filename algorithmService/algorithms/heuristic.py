from collections import defaultdict
import datetime

def get_session_duration_heuristic(delay):
    if delay == 1: return 1.0
    elif delay == 1.5: return 1.5
    else: return 1.0

def get_session_sort_key_heuristic(session):
    try: date_obj = datetime.datetime.fromisoformat(session['date'].split('T')[0])
    except ValueError: date_obj = datetime.datetime.min
    session_order = int(session['numSession'][1:])
    return (date_obj, session_order)

def schedule_surveillance(sessions, teachers_data):
    sessions.sort(key=get_session_sort_key_heuristic)
    teachers_lookup = {t['fullname']: t for t in teachers_data}
    assigned_hours = defaultdict(float)
    all_teacher_names_list = list(teachers_lookup.keys())
    must_assign_teachers = set()
    for session in sessions:
        session['assignedSupervisors'] = []
        session['duration'] = get_session_duration_heuristic(session['delay'])
    warnings = []
    previous_session_assigned = set()
    for i, session in enumerate(sessions):
        session_id = f"{session['day']}-{session['date'].split('T')[0]}-{session['numSession']}"
        needed = session['maxSupervisor']
        duration = session['duration']
        session_responsible = set(session['responsibleName'])
        assigned_this_session = []
        session_assigned_set = set()
        teachers_becoming_mandatory_this_session = set()
        teachers_finishing_mandatory_this_session = set()
        available_now = set()
        for name in all_teacher_names_list:
            teacher_info = teachers_lookup[name]
            max_load = teacher_info.get('hourlyLoad', 0)
            if assigned_hours[name] + duration <= max_load: available_now.add(name)
        tier1 = list(available_now & must_assign_teachers & session_responsible)
        tier2 = list((available_now & must_assign_teachers) - session_responsible)
        tier3 = list((available_now & session_responsible) - must_assign_teachers)
        already_prioritized = set(tier1) | set(tier2) | set(tier3)
        remaining_available = available_now - already_prioritized
        tier4 = list(remaining_available & previous_session_assigned)
        tier5 = list(remaining_available - previous_session_assigned)
        prioritized_candidates = tier1 + tier2 + tier3 + tier4 + tier5
        for teacher_name in prioritized_candidates:
            if needed <= 0: break
            if teacher_name not in session_assigned_set:
                teacher_info = teachers_lookup[teacher_name]
                max_load = teacher_info.get('hourlyLoad', 0)
                current_load = assigned_hours[teacher_name]
                if current_load + duration <= max_load:
                    assigned_this_session.append(teacher_name)
                    session_assigned_set.add(teacher_name)
                    assigned_hours[teacher_name] += duration
                    needed -= 1
                    if teacher_name in session_responsible:
                        if assigned_hours[teacher_name] < max_load: teachers_becoming_mandatory_this_session.add(teacher_name)
                    if teacher_name in must_assign_teachers:
                        if assigned_hours[teacher_name] >= max_load: teachers_finishing_mandatory_this_session.add(teacher_name)
        session['assignedSupervisors'] = assigned_this_session
        if needed > 0: warnings.append(f"Warning: Session {session_id} only assigned {len(assigned_this_session)}/{session['maxSupervisor']} supervisors. Needed {needed} more.")
        must_assign_teachers.update(teachers_becoming_mandatory_this_session)
        must_assign_teachers.difference_update(teachers_finishing_mandatory_this_session)
        previous_session_assigned = session_assigned_set.copy()
    return sessions, dict(assigned_hours), warnings