<script setup>
import { ref, computed, onMounted } from 'vue';
import { differenceInDays, startOfDay, format } from 'date-fns';
import { generateSchedule } from './utils/scheduleGenerator';
import { subjects } from './data/subjects';
import SubjectCard from './components/SubjectCard.vue';
import ScheduleView from './components/ScheduleView.vue';
import defaultProgress from './study_progress.json';

// Configuration
const EXAM_DATE = '2026-03-28';
const TODAY_DATE = new Date(); // Use real date

// UI State
const currentTab = ref('dashboard'); // 'dashboard' or 'schedule'
const isAlertExpanded = ref(true);
const alertContainer = ref(null);

// Data State
const tasks = ref([]);
const completedIds = ref(new Set());
const initialized = ref(false);

// Derived State
const today = startOfDay(TODAY_DATE);
const examDateObj = startOfDay(new Date(EXAM_DATE));
const daysRemaining = computed(() => differenceInDays(examDateObj, today));

    const subjectsList = computed(() => {
      const list = [];
      Object.keys(subjects).forEach(cat => {
        Object.keys(subjects[cat]).forEach(key => {
          list.push({ ...subjects[cat][key], key, category: cat });
        });
      });
      return list;
    });

const groupedTasks = computed(() => {
  const groups = {};
  tasks.value.forEach(t => {
    if (!groups[t.subjectKey]) groups[t.subjectKey] = [];
    groups[t.subjectKey].push(t);
  });
  return groups;
});

const overdueTasks = computed(() => {
  const overdue = [];
  tasks.value.forEach(t => {
    if (completedIds.value.has(t.id)) return;
    if (new Date(t.date) < today) {
      overdue.push(t);
    }
  });
  return overdue;
});

const totalProgress = computed(() => {
  if (tasks.value.length === 0) return 0;
  return Math.round((completedIds.value.size / tasks.value.length) * 100);
});

// Actions
const toggleTask = (id) => {
  if (completedIds.value.has(id)) {
    completedIds.value.delete(id);
  } else {
    completedIds.value.add(id);
  }
  saveState();
};

// Persistence
const STORAGE_KEY = 'studydash_data_v1';

const saveState = () => {
  const data = {
    tasks: tasks.value,
    completed: Array.from(completedIds.value)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadState = () => {
  // Priority 1: Local Storage (Active Session)
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data.tasks && data.tasks.length > 0) {
        console.log("Loaded data from localStorage.");
        tasks.value = data.tasks;
        completedIds.value = new Set(data.completed || []);
        return true;
      }
    } catch (e) {
      console.error("Failed to load local state", e);
    }
  }

  // Priority 2: Default JSON File (User provided file)
  // Only use if it has tasks
  if (defaultProgress && defaultProgress.tasks && defaultProgress.tasks.length > 0) {
      console.log("Loaded data from study_progress.json");
      tasks.value = defaultProgress.tasks;
      completedIds.value = new Set(defaultProgress.completed || []);
      // If we loaded from file, let's sync it to localStorage so subsequent reloads work even if file is removed
      saveState();
      return true;
  }

  return false;
};

const exportData = () => {
  const data = {
    tasks: tasks.value,
    completed: Array.from(completedIds.value)
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study_progress.json`; // Simplified name for easier replacement
  a.click();
  URL.revokeObjectURL(url);
};

const triggerFileInput = () => {
  document.getElementById('importFile').click();
};

const importData = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.tasks && Array.isArray(data.tasks)) {
        if(confirm(`检测到文件中包含 ${data.tasks.length} 个任务，是否覆盖当前计划？`)) {
            tasks.value = data.tasks;
            completedIds.value = new Set(data.completed || []);
            saveState();
            alert('数据导入成功！');
        }
      } else {
        alert('文件格式不正确：缺少 tasks 字段');
      }
    } catch (err) {
      alert('解析文件失败：' + err.message);
    }
  };
  reader.readAsText(file);
};

const resetSchedule = () => {
  if(confirm('确定要重置学习计划吗？這将：\n1. 清除所有现有进度\n2. 根据当前日期重新生成所有任务安排')) {
    const newTasks = generateSchedule(new Date(), EXAM_DATE);
    tasks.value = newTasks;
    completedIds.value = new Set();
    saveState();
  }
};

const forceReloadDefault = () => {
   if (defaultProgress && defaultProgress.tasks && defaultProgress.tasks.length > 0) {
       if(confirm('确定要重新加载本地 study_progress.json 文件吗？这将覆盖当前未保存的进度。')) {
          tasks.value = defaultProgress.tasks;
          completedIds.value = new Set(defaultProgress.completed || []);
          saveState();
          alert('已重新加载默认文件进度。');
       }
   } else {
       alert('src/study_progress.json 文件似乎是空的或格式不正确。');
   }
}

const handleWheel = (e) => {
  if (alertContainer.value) {
    // Only prevent default if we can scroll horizontally
    if (alertContainer.value.scrollWidth > alertContainer.value.clientWidth) {
        // e.preventDefault(); // Optional: uncomment if you want to block vertical scroll
        alertContainer.value.scrollLeft += e.deltaY;
    }
  }
};

onMounted(() => {
  if (!loadState()) {
    // If no data anywhere, generate fresh schedule
    console.log("No stored data found, generating new schedule...");
    tasks.value = generateSchedule(new Date(), EXAM_DATE);
    saveState();
  }
  initialized.value = true;
});
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] pb-20 font-sans text-slate-600">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center text-white font-bold shadow-brand">SD</div>
          <h1 class="text-xl font-bold text-slate-800 tracking-tight hidden sm:block">StudyDash 2026</h1>
        </div>
        
        <!-- Tab Switcher -->
        <div class="flex bg-slate-100 p-1 rounded-lg">
          <button 
            @click="currentTab = 'dashboard'"
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="currentTab === 'dashboard' ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            看板视图
          </button>
          <button 
            @click="currentTab = 'schedule'"
            class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="currentTab === 'schedule' ? 'bg-white text-brand-purple shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            计划表视图
          </button>
        </div>
        
        <div class="flex items-center gap-3 text-sm">
           <!-- Hidden File Input -->
           <input type="file" id="importFile" class="hidden" accept=".json" @change="importData">
           
           <div class="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
             <button @click="forceReloadDefault" class="px-3 py-1.5 hover:bg-slate-50 border-r border-slate-200 transition-colors text-slate-600" title="重新加载 study_progress.json">
               <span class="hidden sm:inline">重载默认</span>
               <span class="sm:hidden">↻</span>
             </button>
             <button @click="exportData" class="px-3 py-1.5 hover:bg-slate-50 border-r border-slate-200 transition-colors text-slate-600" title="导出包含排课计划和进度的JSON文件">
               <span class="hidden sm:inline">导出计划与进度</span>
               <span class="sm:hidden">↓</span>
             </button>
             <button @click="triggerFileInput" class="px-3 py-1.5 hover:bg-slate-50 transition-colors text-slate-600" title="从本地文件导入进度">
               <span class="hidden sm:inline">导入备份</span>
               <span class="sm:hidden">↑</span>
             </button>
           </div>
           
           <button @click="resetSchedule" class="text-slate-400 hover:text-rose-500 px-2 transition-colors" title="重置计划">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
           </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Hero Banner -->
      <div class="bg-gradient-to-r from-brand-purple to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 transform rotate-12"></div>
        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="bg-white/20 text-white text-xs px-2 py-0.5 rounded backdrop-blur-sm">TARGET</span>
              <div class="text-indigo-100 text-sm font-medium">目标考试日期</div>
            </div>
            <div class="text-4xl font-bold mb-3 tracking-tight">2026年3月28日</div>
            <div class="text-indigo-100 text-sm max-w-md leading-relaxed opacity-90">
              保持专注，每一天的努力都在拉近你与梦想的距离！加油！
            </div>
          </div>
          
          <div class="flex gap-4">
             <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center min-w-[140px] border border-white/10">
                <div class="text-xs text-indigo-100 mb-1 uppercase tracking-wider">Remaining</div>
                <div class="text-5xl font-bold mb-1">{{ daysRemaining }}</div>
                <div class="text-xs text-indigo-200">Days Left</div>
             </div>
             
             <div class="bg-white rounded-2xl p-6 text-slate-800 min-w-[200px] shadow-lg flex flex-col justify-center">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex flex-col">
                    <span class="text-xs text-slate-400 font-bold uppercase">Total Progress</span>
                    <span class="text-2xl font-bold text-slate-800">{{ totalProgress }}%</span>
                  </div>
                  <div class="text-2xl">🏆</div>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5">
                  <div class="bg-brand-purple h-full rounded-full transition-all duration-1000" :style="{ width: `${totalProgress}%` }"></div>
                </div>
                <div class="text-[10px] text-slate-400 mt-2 text-right">
                  已完成 {{ completedIds.size }} / {{ tasks.length }} 课时
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Alert Section -->
      <div v-if="overdueTasks.length > 0" class="mb-8">
        <div class="bg-white rounded-xl shadow-md border-l-[6px] border-rose-500 p-6 relative overflow-hidden transition-all hover:shadow-lg">
          
          <!-- Header -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-4">
              <div class="bg-rose-100 p-3 rounded-full text-rose-500 animate-jump shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-700 flex items-baseline gap-2">
                  警报：发现 <span class="text-rose-600 border-b-2 border-rose-200 px-1 font-black text-2xl">{{ overdueTasks.length }}</span> 个学习任务已超时！
                </h3>
              </div>
            </div>
            
            <button v-if="overdueTasks.length > 0" @click="isAlertExpanded = !isAlertExpanded" class="text-sm text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors px-3 py-1 rounded hover:bg-slate-50">
              {{ isAlertExpanded ? '收起' : '查看详情' }} 
              <svg class="w-4 h-4 transition-transform duration-300" :class="{'rotate-180': isAlertExpanded}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>

          <div v-show="isAlertExpanded">
            <p class="text-slate-500 text-sm mb-6 pl-[4.5rem]">以下任务按计划应在今日之前完成，请尽快补课消除红色警报：</p>

            <!-- Cards Grid -->
            <div ref="alertContainer" @wheel="handleWheel" class="flex gap-4 pl-0 md:pl-[4.5rem] overflow-x-auto pb-4 scrollbar-hide">
              <div v-for="task in overdueTasks" :key="task.id" 
                   @click="toggleTask(task.id)"
                   class="bg-white border border-rose-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group relative hover:border-rose-300 hover:-translate-y-0.5 min-w-[280px] shrink-0">
                
                <!-- Card Header -->
                <div class="flex justify-between items-center mb-3">
                   <div class="flex gap-1 overflow-hidden">
                      <span class="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 truncate max-w-[60%]">
                      {{ task.subjectName }}
                      </span>
                      <span v-if="task.type === 'practice'" class="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-1 rounded-md border border-indigo-100 shrink-0">
                      刷题
                      </span>
                   </div>
                   <span class="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm shadow-rose-200 shrink-0">超期</span>
                </div>
                
                <!-- Content -->
                <div class="font-bold text-slate-800 text-base mb-4 line-clamp-2 h-10 leading-tight">
                   <span class="text-slate-300 mr-1">{{ task.index }}.</span>{{ task.moduleName }}
                </div>
                
                <!-- Footer -->
                <div class="text-xs text-rose-600 flex items-center gap-1.5 font-medium bg-rose-50 p-2 rounded-lg group-hover:bg-rose-100 transition-colors">
                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   截止: {{ task.date }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW: DASHBOARD -->
      <div v-if="currentTab === 'dashboard'">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-1 h-6 bg-brand-purple rounded-full"></div>
          <h2 class="text-xl font-bold text-slate-800">课程全景视图</h2>
          <div class="ml-auto flex items-center gap-4 text-xs font-medium">
             <div class="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-100 shadow-sm">
              <div class="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>
              <span class="text-slate-600">职测</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-100 shadow-sm">
              <div class="w-2.5 h-2.5 rounded-sm bg-orange-500"></div>
              <span class="text-slate-600">综应</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-100 shadow-sm">
              <div class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
              <span class="text-slate-600">计算机专业课</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SubjectCard 
            v-for="sub in subjectsList" 
            :key="sub.key"
            :subject="sub"
            :tasks="groupedTasks[sub.key] || []"
            :completedIds="completedIds"
            @toggle="toggleTask"
          />
        </div>
      </div>

      <!-- VIEW: SCHEDULE -->
      <div v-if="currentTab === 'schedule'">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-1 h-6 bg-brand-purple rounded-full"></div>
          <h2 class="text-xl font-bold text-slate-800">每日计划表</h2>
          <p class="ml-2 text-sm text-slate-400">系统已自动为您规划每日任务，点击任务即可标记完成。</p>
        </div>
        
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[500px]">
           <ScheduleView 
             :tasks="tasks" 
             :completedIds="completedIds"
             @toggle="toggleTask"
           />
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.shadow-brand {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}
@keyframes jump {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.animate-jump {
  animation: jump 1s infinite ease-in-out;
}
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>
