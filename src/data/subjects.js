export const subjectCategories = {
    "vocational_aptitude_test": {
        name: "职业能力倾向测验",
        colorClass: "from-blue-50 to-indigo-50", // Keep for top bar gradient if needed
        bgClass: "bg-gradient-to-br from-white to-blue-50/50", // Subtle full background
        borderClass: "border-blue-100",
        textClass: "text-slate-800",
        iconClass: "bg-blue-100 text-blue-600",
        barClass: "bg-blue-500",
        badgeClass: "bg-blue-50 text-blue-600 border-blue-100"
    },
    "comprehensive_application": {
        name: "综合应用能力",
        colorClass: "from-orange-50 to-amber-50",
        bgClass: "bg-gradient-to-br from-white to-orange-50/50",
        borderClass: "border-orange-100",
        textClass: "text-slate-800",
        iconClass: "bg-orange-100 text-orange-600",
        barClass: "bg-orange-500",
        badgeClass: "bg-orange-50 text-orange-600 border-orange-100"
    },
    "computer_science": {
        name: "计算机专业课",
        colorClass: "from-emerald-50 to-teal-50",
        bgClass: "bg-gradient-to-br from-white to-emerald-50/50",
        borderClass: "border-emerald-100",
        textClass: "text-slate-800",
        iconClass: "bg-emerald-100 text-emerald-600",
        barClass: "bg-emerald-500",
        badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-100"
    }
};

export const subjects = {
    "vocational_aptitude_test": {
        "political_theory": {
            "name": "政治理论",
            "parent": "vocational_aptitude_test",
            "question_quantity": 10,
            "remarks": "属于常识判断，侧重时政",
            "practice_workday": 10
        },
        "other_general_knowledge": {
            "name": "基础常识",
            "parent": "vocational_aptitude_test",
            "question_quantity": 10,
            "remarks": "属于常识判断，侧重科技领域与理科常识",
            "practice_workday": 10
        },
        "verbal_comprehension": {
            "name": "言语理解与表达",
            "parent": "vocational_aptitude_test",
            "question_quantity": 25,
            "remarks": "含词语填空、语句排序、主旨概括等",
            "practice_workday": 10
        },
        "quantitative_relation": {
            "name": "数量关系",
            "parent": "vocational_aptitude_test",
            "question_quantity": 10,
            "remarks": "数量分析模块下的数学运算部分",
            "practice_workday": 5
        },
        "data_analysis": {
            "name": "资料分析",
            "parent": "vocational_aptitude_test",
            "question_quantity": 5,
            "remarks": "数量分析模块下的资料分析部分",
            "practice_workday": 5
        },
        "judgment_reasoning": {
            "name": "判断推理",
            "parent": "vocational_aptitude_test",
            "question_quantity": 35,
            "remarks": "含图推、定义、类比、逻辑及综合判断推理",
            "practice_workday": 5
        },
        "comprehensive_analysis": {
            "name": "综合分析",
            "parent": "vocational_aptitude_test",
            "question_quantity": 10,
            "remarks": "含策略制定（约5道）与实验设计（约5道）",
            "practice_workday": 10
        }
    },
    "comprehensive_application": {
        "science_literature_reading": {
            "name": "科技文献阅读题",
            "parent": "comprehensive_application",
            "question_quantity": 1,
            "remarks": "配套 5-6 小题，主客观结合，核心题型",
            "practice_workday": 1
        },
        "argument_evaluation": {
            "name": "论证评价题",
            "parent": "comprehensive_application",
            "question_quantity": 1,
            "remarks": "纯主观题，常规 1 道大题",
            "practice_workday": 1
        },
        "science_practice": {
            "name": "科技实务题",
            "parent": "comprehensive_application",
            "question_quantity": 1,
            "remarks": "含数据加工、图表绘制等",
            "practice_workday": 1
        },
        "material_writing": {
            "name": "材料作文题",
            "parent": "comprehensive_application",
            "question_quantity": 1,
            "remarks": "议论文写作",
            "practice_workday": 0
        }
    },
    "computer_science": {
        "computer_major": {
            "name": "计算机专业课",
            "parent": "computer_science",
            "question_quantity": 0,
            "remarks": "计算机专业相关课程",
            "practice_workday": 0
        }
    }
};