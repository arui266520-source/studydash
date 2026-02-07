import { addDays, differenceInDays, isSaturday, isSunday, format, startOfDay, isBefore } from 'date-fns';
import { subjects } from '../data/subjects.js';
import { courses } from '../data/courses.js';

const flatSubjects = {};
Object.keys(subjects).forEach(cat => {
    Object.keys(subjects[cat]).forEach(subKey => {
        flatSubjects[subKey] = {...subjects[cat][subKey], category: cat, key: subKey };
    });
});

export function generateSchedule(startDateStr = new Date(), examDateStr = '2026-03-28') {
    const startDate = startOfDay(new Date(startDateStr));
    const examDate = startOfDay(new Date(examDateStr));

    // 1. Create Task Pool
    let taskPool = [];

    courses.forEach(course => {
        course.modules.forEach(mod => {
            const hours = mod.credit_hours;
            const targets = mod.target_subject_keys;
            const basePerTarget = Math.floor(hours / targets.length);
            let remainder = hours % targets.length;

            targets.forEach((targetKey, tIndex) => {
                let count = basePerTarget;
                if (remainder > 0) {
                    count++;
                    remainder--;
                }

                for (let i = 0; i < count; i++) {
                    taskPool.push({
                        id: `${course.institution}-${mod.name}-${targetKey}-${i}`,
                        subjectKey: targetKey,
                        subjectName: (flatSubjects[targetKey] && flatSubjects[targetKey].name) || targetKey,
                        courseInstitution: course.institution,
                        moduleName: mod.name,
                        index: i + 1,
                        totalInModule: count
                    });
                }
            });
        });
    });

    const totalDays = differenceInDays(examDate, startDate);
    if (totalDays <= 0) return { tasks: [], schedule: {} };

    // 2. Prep for Balanced Scheduling
    const tasksBySubject = {};
    const subjectTotals = {};

    Object.keys(flatSubjects).forEach(k => {
        tasksBySubject[k] = [];
        subjectTotals[k] = 0;
    });

    taskPool.forEach(t => {
        if (!tasksBySubject[t.subjectKey]) {
            tasksBySubject[t.subjectKey] = [];
            subjectTotals[t.subjectKey] = 0;
        }
        tasksBySubject[t.subjectKey].push(t);
        subjectTotals[t.subjectKey]++;
    });

    // Calculate ideal "Tasks Per Day" for each subject to finish exactly on time
    const subjectDailyRates = {};
    Object.keys(subjectTotals).forEach(k => {
        subjectDailyRates[k] = subjectTotals[k] / totalDays;
    });

    // Track progress
    const subjectProgress = {}; // key -> count assigned
    Object.keys(subjectTotals).forEach(k => subjectProgress[k] = 0);

    // 3. Daily Loop
    const assignedTasks = [];

    // Pre-calculate daily weights to ensure exact distribution
    const dailyWeights = [];
    let d = new Date(startDate);
    let totalWeight = 0;

    for (let i = 0; i < totalDays; i++) {
        const isWeekend = isSaturday(d) || isSunday(d);
        // Weekend multiplier: 1.8x load (Reduced from 2.5 to spread tasks more evenly)
        const weight = isWeekend ? 1.8 : 1.0;
        dailyWeights.push({
            date: new Date(d),
            weight: weight,
            isWeekend: isWeekend
        });
        totalWeight += weight;
        d = addDays(d, 1);
    }

    const totalItems = taskPool.length;
    let accumulatedWeight = 0;
    let accumulatedTasksAssigned = 0;

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const dayInfo = dailyWeights[dayIndex];
        const dateStr = format(dayInfo.date, 'yyyy-MM-dd');
        const isWeekend = dayInfo.isWeekend;

        accumulatedWeight += dayInfo.weight;

        // Calculate exact target for today based on cumulative weight
        // This ensures we land exactly on totalItems at the last day
        const targetTotalAssigned = Math.round((accumulatedWeight / totalWeight) * totalItems);

        // Quota for today is target total minus what we've already assigned
        let dailyQuota = targetTotalAssigned - accumulatedTasksAssigned;

        // Safety check
        if (dailyQuota < 0) dailyQuota = 0;

        let slotsRemaining = dailyQuota;

        // Select subjects for today
        // We want 2-3 subjects (or more on weekends)
        // Score each subject: (IdealAssigned - ActualAssigned). Higher means "More Behind".
        const candidates = Object.keys(tasksBySubject).filter(k => tasksBySubject[k].length > 0);

        candidates.sort((a, b) => {
            // Ideal progress based on global time progress (dayIndex / totalDays)
            // Or better, based on weight progress
            const progressRatio = accumulatedWeight / totalWeight;

            const idealA = subjectTotals[a] * progressRatio;
            const diffA = idealA - subjectProgress[a];

            const idealB = subjectTotals[b] * progressRatio;
            const diffB = idealB - subjectProgress[b];

            return diffB - diffA; // Descending (most behind first)
        });

        // Pick top N subjects
        const numSubjects = isWeekend ? 4 : 3;
        const subjectsForDay = candidates.slice(0, numSubjects);

        // Distribute slots among these subjects
        let subIdx = 0;
        let loopCount = 0;

        while (slotsRemaining > 0 && candidates.length > 0 && loopCount < 2000) {
            loopCount++;

            // If subjectsForDay is empty (all chosen subjects exhausted), replenish from candidates
            if (subjectsForDay.length === 0) {
                // Remove exhausted subjects from candidates first
                for (let i = candidates.length - 1; i >= 0; i--) {
                    if (tasksBySubject[candidates[i]].length === 0) {
                        candidates.splice(i, 1);
                    }
                }
                if (candidates.length === 0) break;
                // Add next batch
                subjectsForDay.push(...candidates.slice(0, Math.min(candidates.length, 2)));
            }

            const subKey = subjectsForDay[subIdx % subjectsForDay.length];

            if (tasksBySubject[subKey] && tasksBySubject[subKey].length > 0) {
                const task = tasksBySubject[subKey].shift();
                task.date = dateStr;
                task.isCompleted = false;
                task.isOverdue = false;

                assignedTasks.push(task);
                subjectProgress[subKey]++;

                accumulatedTasksAssigned++;
                slotsRemaining--;
            } else {
                // Subject exhausted, remove from rotation
                subjectsForDay.splice(subIdx % subjectsForDay.length, 1);
                continue; // Retry loop without incrementing subIdx
            }
            subIdx++;
        }
    }

    // Dump remaining (if any, though math should prevent this) to the last day
    const leftovers = [];
    Object.keys(tasksBySubject).forEach(k => {
        while (tasksBySubject[k].length > 0) {
            const t = tasksBySubject[k].shift();
            leftovers.push(t);
        }
    });

    if (leftovers.length > 0) {
        const lastDateStr = format(dailyWeights[totalDays - 1].date, 'yyyy-MM-dd');
        leftovers.forEach(t => {
            t.date = lastDateStr;
            t.isCompleted = false;
            assignedTasks.push(t);
        });
    }

    // Sort assignedTasks by date then index
    assignedTasks.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.subjectKey.localeCompare(b.subjectKey);
    });

    return assignedTasks;
}