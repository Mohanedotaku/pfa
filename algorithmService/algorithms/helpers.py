from collections import defaultdict
import random
import copy

def calculate_fitness(schedule, sessions_info, teachers_info, sorted_session_keys):
    penalties = 0
    assigned_hours = defaultdict(float)
    teacher_assignments = defaultdict(list)

    for session_key in sorted_session_keys:
        session_detail = sessions_info.get(session_key)
        if not session_detail:
            continue

        duration = session_detail['delay']
        assigned_supervisors = schedule.get(session_key, set())

        for teacher in assigned_supervisors:
            assigned_hours[teacher] += duration
            teacher_assignments[teacher].append(session_key)

        needed = session_detail['maxSupervisor']
        assigned_count = len(assigned_supervisors)
        if assigned_count < needed:
            penalties += 500 * (needed - assigned_count)

    for teacher, total_hours in assigned_hours.items():
        max_load = teachers_info.get(teacher, {}).get('hourlyLoad', 0)
        if total_hours > max_load:
            penalties += 1000 * (total_hours - max_load)

    return penalties

def create_initial_population(size, heuristic_schedule, sessions_info, teachers_info, sorted_session_keys, all_teacher_names):
    population = [heuristic_schedule]
    while len(population) < size:
        individual = {}
        temp_hours = defaultdict(float)

        for skey in sorted_session_keys:
            s_info = sessions_info[skey]
            needed = s_info['maxSupervisor']
            duration = s_info['delay']
            assigned = set()

            candidates = list(all_teacher_names)
            random.shuffle(candidates)
            count = 0

            for teacher in candidates:
                if count >= needed:
                    break

                max_h = teachers_info.get(teacher, {}).get('hourlyLoad', 999)
                if temp_hours[teacher] + duration <= max_h:
                    assigned.add(teacher)
                    temp_hours[teacher] += duration
                    count += 1

            individual[skey] = assigned

        population.append(individual)

    return population

def selection(population, fitnesses, tournament_size):
    tournament_indices = random.sample(range(len(population)), min(tournament_size, len(population)))
    if not tournament_indices:
        return population[0]

    tournament_fitnesses = [fitnesses[i] for i in tournament_indices]
    min_fitness_in_tournament = min(tournament_fitnesses)
    winner_original_index = tournament_indices[tournament_fitnesses.index(min_fitness_in_tournament)]

    return population[winner_original_index]

def crossover(parent1, parent2, sorted_session_keys, crossover_rate):
    if random.random() > crossover_rate:
        return copy.deepcopy(parent1), copy.deepcopy(parent2)

    child1, child2 = {}, {}
    num_sessions = len(sorted_session_keys)

    if num_sessions <= 1:
        return copy.deepcopy(parent1), copy.deepcopy(parent2)

    crossover_point = random.randint(1, num_sessions - 1)

    for i, key in enumerate(sorted_session_keys):
        if i < crossover_point:
            child1[key] = copy.deepcopy(parent1.get(key, set()))
            child2[key] = copy.deepcopy(parent2.get(key, set()))
        else:
            child1[key] = copy.deepcopy(parent2.get(key, set()))
            child2[key] = copy.deepcopy(parent1.get(key, set()))

    return child1, child2

def mutate(individual, sessions_info, teachers_info, sorted_session_keys, all_teacher_names, mutation_rate):
    if random.random() > mutation_rate:
        return individual

    mutated_individual = copy.deepcopy(individual)

    if not sorted_session_keys:
        return mutated_individual

    session_key_to_mutate = random.choice(sorted_session_keys)
    session_detail = sessions_info[session_key_to_mutate]
    duration = session_detail['delay']
    assigned = mutated_individual.get(session_key_to_mutate, set())

    teacher_to_remove = None
    if assigned:
        teacher_to_remove = random.choice(list(assigned))
        assigned.remove(teacher_to_remove)

    potential_adds = list(set(all_teacher_names) - assigned - ({teacher_to_remove} if teacher_to_remove else set()))
    random.shuffle(potential_adds)

    temp_hours = defaultdict(float)
    session_index = sorted_session_keys.index(session_key_to_mutate)

    for i in range(session_index):
        key = sorted_session_keys[i]
        dur = sessions_info[key]['delay']
        for t in mutated_individual.get(key, set()):
            temp_hours[t] += dur

    for teacher_to_add in potential_adds:
        max_load = teachers_info.get(teacher_to_add, {}).get('hourlyLoad', 0)
        if temp_hours[teacher_to_add] + duration <= max_load:
            assigned.add(teacher_to_add)
            break

    mutated_individual[session_key_to_mutate] = assigned

    return mutated_individual