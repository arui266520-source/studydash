<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { format, parseISO, isSameDay, startOfDay, isBefore, isAfter } from 'date-fns';
import { subjectCategories, subjects } from '../data/subjects';

const props = defineProps({
  tasks: Array,
  completedIds: Set
});

const emit = defineEmits(['toggle']);

const today = startOfDay(new Date());

const tasksByDate = computed(() => {
  const groups = {};
  props.tasks.forEach(task => {
    if (!groups[task.date]) groups[task.date] = [];
    groups[task.date].push(task);
  });
  
  // Convert to array and sort
  return Object.keys(groups).sort().map(date => ({
    date,
    dateObj: parseISO(date),
    tasks: groups[date]
  }));
});

// State for expanded sections
// Use a Set to allow multiple sections to be open if needed, or just a string for accordion
// User asked for "default only expand today", implying accordion-like or toggleable behavior.
const expandedDates = ref(new Set());

const toggleDate = (date) => {
  if (expandedDates.value.has(date)) {
    expandedDates.value.delete(date);
  } else {
    expandedDates.value.add(date);
  }
};

// Initialize default expanded state
watch(tasksByDate, (newVal) => {
    if (newVal.length > 0 && expandedDates.value.size === 0) {
        const todayStr = format(today, 'yyyy-MM-dd');
        // Find if today exists
        const hasToday = newVal.find(g => g.date === todayStr);
        if (hasToday) {
            expandedDates.value.add(todayStr);
        } else {
            // Expand the first future date, or just the first date if all are past
            const firstFuture = newVal.find(g => !isBefore(g.dateObj, today));
            if (firstFuture) {
                expandedDates.value.add(firstFuture.date);
            } else if (newVal.length > 0) {
                expandedDates.value.add(newVal[0].date);
            }
        }
    }
}, { immediate: true });


const getStatus = (task) => {
  if (props.completedIds.has(task.id)) return 'completed';
  const taskDate = parseISO(task.date);
  if (isBefore(taskDate, today)) return 'overdue';
  return 'pending';
};

const getCategoryColor = (subjectKey) => {
   // Need to find category for this subject key
   // We flattened subjects in generator but here we need to lookup
   for (const catKey in subjects) {
       if (subjects[catKey][subjectKey]) {
           return subjectCategories[catKey];
       }
   }
   return null;
};

const getTaskStyle = (task) => {
    const status = getStatus(task);
    const catConfig = getCategoryColor(task.subjectKey);
    
    if (status === 'completed') {
        return 'bg-emerald-50 border-emerald-200 text-emerald-800 opacity-70'; // Dim completed tasks
    }
    if (status === 'overdue') {
        return 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm';
    }
    
    // Pending state - use category colors
    if (task.type === 'practice') {
        return 'bg-indigo-50 border-indigo-100 text-indigo-900 hover:border-indigo-300 hover:shadow-md hover:bg-white';
    }

    if (catConfig) {
        // We can't use dynamic classes easily with full safety, but we can return inline styles or specific known classes
        // Let's rely on the config classes we added
        if (catConfig.name.includes('职业')) { // vocational
             return 'bg-blue-50 border-blue-100 text-blue-900 hover:border-blue-300 hover:shadow-md hover:bg-white';
        }
        if (catConfig.name.includes('综合')) { // comprehensive
             return 'bg-orange-50 border-orange-100 text-orange-900 hover:border-orange-300 hover:shadow-md hover:bg-white';
        }
    }
    
    return 'bg-white border-slate-200 text-slate-700 hover:border-brand-purple';
};

const formatWeekday = (dateObj) => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[dateObj.getDay()];
};

const isToday = (dateObj) => isSameDay(dateObj, today);
</script>

<template>
  <div class="space-y-4">
    <div v-if="tasksByDate.length === 0" class="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <div class="text-4xl mb-2">📭</div>
      暂无学习计划，请先生成计划。
    </div>

    <div v-for="dayGroup in tasksByDate" :key="dayGroup.date" 
         class="group rounded-xl border transition-all duration-300 overflow-hidden"
         :class="[
            isToday(dayGroup.dateObj) ? 'border-brand-purple/30 shadow-md bg-white' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm'
         ]"
    >
      
      <!-- Date Header (Clickable) -->
      <div 
        @click="toggleDate(dayGroup.date)"
        class="flex items-center justify-between p-4 cursor-pointer select-none"
        :class="isToday(dayGroup.dateObj) ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50' : ''"
      >
        <div class="flex items-center gap-3">
          <!-- Status Indicator Dot -->
          <div 
            class="w-2.5 h-2.5 rounded-full shadow-sm"
            :class="isToday(dayGroup.dateObj) ? 'bg-brand-purple animate-pulse' : (isBefore(dayGroup.dateObj, today) ? 'bg-slate-300' : 'bg-emerald-400')"
          ></div>
          
          <div class="flex items-baseline gap-2">
            <h3 class="text-lg font-bold font-mono tracking-tight" :class="isToday(dayGroup.dateObj) ? 'text-brand-purple' : 'text-slate-700'">
                {{ format(dayGroup.dateObj, 'MM-dd') }}
            </h3>
            <span class="text-sm font-medium px-2 py-0.5 rounded-full" 
                  :class="isToday(dayGroup.dateObj) ? 'bg-brand-purple text-white' : 'bg-slate-200 text-slate-500'">
              {{ isToday(dayGroup.dateObj) ? '今天' : formatWeekday(dayGroup.dateObj) }}
            </span>
          </div>
          
          <!-- Progress for this day -->
          <div class="text-xs text-slate-400 font-medium ml-2">
             {{ dayGroup.tasks.filter(t => props.completedIds.has(t.id)).length }}/{{ dayGroup.tasks.length }} 完成
          </div>
        </div>
        
        <!-- Chevron -->
        <div class="text-slate-400 transition-transform duration-300" :class="expandedDates.has(dayGroup.date) ? 'rotate-180' : ''">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      <!-- Task List (Expandable) -->
      <div 
        v-show="expandedDates.has(dayGroup.date)" 
        class="p-4 pt-0 border-t border-slate-100/50"
        :class="isToday(dayGroup.dateObj) ? 'bg-white' : ''"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          <div 
            v-for="task in dayGroup.tasks" 
            :key="task.id"
            @click="emit('toggle', task.id)"
            class="border rounded-lg p-3 cursor-pointer transition-all duration-200 flex items-start gap-3 group/task relative overflow-hidden"
            :class="getTaskStyle(task)"
          >
            <!-- Checkbox -->
            <div 
              class="w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-colors shrink-0 z-10"
              :class="props.completedIds.has(task.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white/50 border-black/10 group-hover/task:border-brand-purple'"
            >
               <svg v-if="props.completedIds.has(task.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
  
            <div class="flex-1 min-w-0 z-10">
              <div class="flex justify-between items-start mb-1">
                <span class="text-xs font-bold opacity-75 tracking-wide">{{ task.subjectName }}</span>
                <span v-if="task.type === 'practice'" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-bold">刷题</span>
                <span v-else class="text-[10px] px-1.5 py-0.5 rounded bg-black/5 font-mono">{{ task.index }}/{{ task.totalInModule }}</span>
              </div>
              <div class="text-sm font-bold truncate leading-tight mb-0.5">{{ task.moduleName }}</div>
              <div class="text-xs opacity-60 truncate">{{ task.courseInstitution }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
