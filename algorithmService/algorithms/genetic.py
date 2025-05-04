from collections import defaultdict
from algorithms.helpers import calculate_fitness, create_initial_population, selection, crossover, mutate

def run_genetic_algorithm(heuristic_sessions, sessions_data, teachers_data):
    teachers_info_dict = {t['fullname']: t for t in teachers_data}
    sessions_info_dict = {}
    for s in sessions_data:
        key = (s['date'].split('T')[0], s['numSession'])
        sessions_info_dict[key] = s
    all_teachers_list = list(teachers_info_dict.keys())
    sorted_session_keys = sorted(sessions_info_dict.keys(), key=lambda k: (k[0], int(k[1][1:])))

    # Convert heuristic_sessions to a dictionary format expected by create_initial_population
    heuristic_schedule = {}
    for session in heuristic_sessions:
        key = (session['date'].split('T')[0], session['numSession'])
        heuristic_schedule[key] = set(session['assignedSupervisors'])

    # Pass heuristic_schedule to create_initial_population
    population = create_initial_population(60, heuristic_schedule, sessions_info_dict, teachers_info_dict, sorted_session_keys, all_teachers_list)
    
    # Convert heuristic_sessions to a dictionary format expected by calculate_fitness
    heuristic_schedule = {}
    for session in heuristic_sessions:
        key = (session['date'].split('T')[0], session['numSession'])
        heuristic_schedule[key] = set(session['assignedSupervisors'])

    best_fitness_overall = calculate_fitness(heuristic_schedule, sessions_info_dict, teachers_info_dict, sorted_session_keys)

    best_schedule_overall = heuristic_sessions

    for generation in range(200):
        fitnesses = [calculate_fitness(ind, sessions_info_dict, teachers_info_dict, sorted_session_keys) for ind in population]
        min_fitness_gen = min(fitnesses)
        best_index_gen = fitnesses.index(min_fitness_gen)
        if min_fitness_gen < best_fitness_overall:
            best_fitness_overall = min_fitness_gen
            best_schedule_overall = population[best_index_gen]
        new_population = [population[best_index_gen]]
        while len(new_population) < 60:
            parent1 = selection(population, fitnesses, 5)
            parent2 = selection(population, fitnesses, 5)
            child1, child2 = crossover(parent1, parent2, sorted_session_keys, 0.8)
            child1 = mutate(child1, sessions_info_dict, teachers_info_dict, sorted_session_keys, all_teachers_list, 0.15)
            child2 = mutate(child2, sessions_info_dict, teachers_info_dict, sorted_session_keys, all_teachers_list, 0.15)
            new_population.append(child1)
            if len(new_population) < 60:
                new_population.append(child2)
        population = new_population

    # Ensure best_schedule_overall is a dictionary
    if isinstance(best_schedule_overall, list):
        best_schedule_dict = {}
        for session in best_schedule_overall:
            key = (session['date'].split('T')[0], session['numSession'])
            best_schedule_dict[key] = set(session['assignedSupervisors'])
        best_schedule_overall = best_schedule_dict

    teacher_schedule = []
    for teacher in teachers_data:
        teacher_name = teacher['fullname']
        teacher_sessions = []
        for session_key, session_info in sessions_info_dict.items():
            if teacher_name in best_schedule_overall.get(session_key, set()):
                date = session_key[0]
                session_num = session_key[1]
                existing_date_entry = next((entry for entry in teacher_sessions if entry['Date'] == date), None)
                if existing_date_entry:
                    existing_date_entry['Sessions'].append(session_num)
                else:
                    teacher_sessions.append({"Date": date, "Sessions": [session_num]})

        teacher_schedule.append({
            "TeacherName": teacher_name,
            "HourlyLoad": teacher['hourlyLoad'],
            "Grade": teacher['grade'],
            "Sessions": teacher_sessions
        })

    return teacher_schedule