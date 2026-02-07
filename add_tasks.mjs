import fs from 'fs';

const filePath = 'D:/My Projects/studydash/src/study_progress.json';
const rootFilePath = 'D:/My Projects/studydash/study_progress.json';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    const newTasks = [];
    // Start from March 28, 2026
    const startDate = new Date('2026-03-28');

    for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        newTasks.push({
            "id": `计算机专业课-计算机专业课-computer_major-${i}`,
            "subjectKey": "computer_major",
            "subjectName": "计算机专业课",
            "courseInstitution": "计算机专业课",
            "moduleName": "计算机专业课",
            "index": i + 1,
            "totalInModule": 30,
            "date": dateStr,
            "isCompleted": false,
            "isOverdue": false
        });
    }

    data.tasks.push(...newTasks);

    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    fs.writeFileSync(rootFilePath, jsonString, 'utf8');

    console.log('Successfully added 30 computer science tasks.');
} catch (error) {
    console.error('Error:', error);
}