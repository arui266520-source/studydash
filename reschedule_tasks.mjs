import fs from 'fs';

const filePath = 'D:/My Projects/studydash/src/study_progress.json';
const rootFilePath = 'D:/My Projects/studydash/study_progress.json';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Filter out computer_major tasks to reschedule them
    const otherTasks = data.tasks.filter(t => t.subjectKey !== 'computer_major');
    let computerTasks = data.tasks.filter(t => t.subjectKey === 'computer_major');

    // If computerTasks is empty (e.g. if previous step failed or overwritten), recreate them
    if (computerTasks.length === 0) {
        for (let i = 0; i < 30; i++) {
            computerTasks.push({
                "id": `计算机专业课-计算机专业课-computer_major-${i}`,
                "subjectKey": "computer_major",
                "subjectName": "计算机专业课",
                "courseInstitution": "计算机专业课",
                "moduleName": "计算机专业课",
                "index": i + 1,
                "totalInModule": 30,
                "isCompleted": false,
                "isOverdue": false
            });
        }
    }

    // Schedule: Feb 7, 2026 to March 15, 2026
    const startDate = new Date('2026-02-07');
    const endDate = new Date('2026-03-15');
    const totalDurationDays = (endDate - startDate) / (1000 * 60 * 60 * 24); // approx 36-37 days

    computerTasks.forEach((task, index) => {
        // Distribute 30 tasks over the duration
        // index / 29 (since 0..29) * totalDuration
        const dayOffset = Math.floor((index / 29) * totalDurationDays);

        const taskDate = new Date(startDate);
        taskDate.setDate(startDate.getDate() + dayOffset);

        task.date = taskDate.toISOString().split('T')[0];
    });

    // Merge and sort
    const allTasks = [...otherTasks, ...computerTasks];
    allTasks.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return 0;
    });

    data.tasks = allTasks;

    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    fs.writeFileSync(rootFilePath, jsonString, 'utf8');

    console.log(`Rescheduled ${computerTasks.length} computer science tasks from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}.`);
} catch (error) {
    console.error('Error:', error);
}