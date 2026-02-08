import fs from 'fs';
import { addDays, differenceInDays, isSaturday, isSunday, format, startOfDay } from 'date-fns';

// Hardcode subjects data here to avoid import issues in standalone script without babel/setup
const subjectsData = {
    "vocational_aptitude_test": {
        "political_theory": { name: "政治理论", practice_workday: 10 },
        "other_general_knowledge": { name: "基础常识", practice_workday: 10 },
        "verbal_comprehension": { name: "言语理解与表达", practice_workday: 10 },
        "quantitative_relation": { name: "数量关系", practice_workday: 5 },
        "data_analysis": { name: "资料分析", practice_workday: 5 },
        "judgment_reasoning": { name: "判断推理", practice_workday: 5 },
        "comprehensive_analysis": { name: "综合分析", practice_workday: 10 }
    },
    "comprehensive_application": {
        "science_literature_reading": { name: "科技文献阅读题", practice_workday: 1 },
        "argument_evaluation": { name: "论证评价题", practice_workday: 1 },
        "science_practice": { name: "科技实务题", practice_workday: 1 },
        "material_writing": { name: "材料作文题", practice_workday: 0 }
    },
    "computer_science": {
        "computer_major": { name: "计算机专业课", practice_workday: 0 }
    }
};

const flatSubjects = {};
Object.keys(subjectsData).forEach(cat => {
    Object.keys(subjectsData[cat]).forEach(subKey => {
        flatSubjects[subKey] = {...subjectsData[cat][subKey], category: cat, key: subKey };
    });
});

const filePath = 'D:/My Projects/studydash/src/study_progress.json';
const rootFilePath = 'D:/My Projects/studydash/study_progress.json';

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    const existingIds = new Set(data.tasks.map(t => t.id));

    const startDate = new Date('2026-02-07'); // From Today
    const examDate = new Date('2026-03-28');
    const totalDays = differenceInDays(examDate, startDate);

    let newTasks = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < totalDays; i++) {
        const isWeekend = isSaturday(currentDate) || isSunday(currentDate);
        const multiplier = isWeekend ? 2 : 1;
        const dateStr = currentDate.toISOString().split('T')[0];

        Object.keys(flatSubjects).forEach(subKey => {
            const subject = flatSubjects[subKey];
            const baseCount = subject.practice_workday || 0;

            if (baseCount > 0) {
                const dailyCount = baseCount * multiplier;
                const taskId = `practice-${dateStr}-${subKey}`;

                if (!existingIds.has(taskId)) {
                    newTasks.push({
                        id: taskId,
                        type: 'practice',
                        subjectKey: subKey,
                        subjectName: subject.name,
                        courseInstitution: '每日刷题',
                        moduleName: `刷题：${dailyCount}题`,
                        index: i + 1,
                        totalInModule: dailyCount,
                        date: dateStr,
                        isCompleted: false,
                        isOverdue: false
                    });
                }
            }
        });
        currentDate = addDays(currentDate, 1);
    }

    // Merge
    data.tasks = [...data.tasks, ...newTasks];

    // Sort
    data.tasks.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return 0; // Keep existing order for same day usually
    });

    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');
    fs.writeFileSync(rootFilePath, jsonString, 'utf8');

    console.log(`Generated and added ${newTasks.length} practice tasks.`);

} catch (error) {
    console.error('Error:', error);
}