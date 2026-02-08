<script setup>
import { computed } from 'vue';
import { isBefore, startOfDay, parseISO } from 'date-fns';
import { subjectCategories } from '../data/subjects';

const props = defineProps({
  subject: Object,
  tasks: Array,
  completedIds: Set
});

const emit = defineEmits(['toggle']);

const today = startOfDay(new Date());

// Filter tasks
const lessonTasks = computed(() => props.tasks.filter(t => t.type !== 'practice'));
const practiceTasks = computed(() => props.tasks.filter(t => t.type === 'practice'));

// Lesson Stats
const lessonTotal = computed(() => lessonTasks.value.length);
const lessonCompletedCount = computed(() => lessonTasks.value.filter(t => props.completedIds.has(t.id)).length);
const lessonPercentage = computed(() => lessonTotal.value === 0 ? 0 : Math.round((lessonCompletedCount.value / lessonTotal.value) * 100));

// Practice Stats
const practiceTotalItems = computed(() => practiceTasks.value.length);
const practiceCompletedItems = computed(() => practiceTasks.value.filter(t => props.completedIds.has(t.id)).length);
// Sum up actual question counts
const practiceTotalQuestions = computed(() => practiceTasks.value.reduce((acc, t) => acc + (t.totalInModule || 0), 0));
const practiceCompletedQuestions = computed(() => practiceTasks.value.filter(t => props.completedIds.has(t.id)).reduce((acc, t) => acc + (t.totalInModule || 0), 0));
const practicePercentage = computed(() => practiceTotalItems.value === 0 ? 0 : Math.round((practiceCompletedItems.value / practiceTotalItems.value) * 100));


const categoryConfig = computed(() => subjectCategories[props.subject.category] || {});

const getTaskStatus = (task) => {
  const isCompleted = props.completedIds.has(task.id);
  if (isCompleted) return 'completed';
  
  const taskDate = parseISO(task.date);
  if (isBefore(taskDate, today)) return 'overdue';
  
  return 'pending';
};

const getSquareClass = (task) => {
  const status = getTaskStatus(task);
  if (status === 'completed') return 'bg-emerald-400 hover:bg-emerald-500 text-emerald-900 shadow-sm';
  if (status === 'overdue') return 'bg-rose-400 hover:bg-rose-500 animate-pulse text-rose-900 shadow-sm';
  
  // Pending colors
  if (props.subject.category === 'vocational_aptitude_test') {
      return 'bg-blue-100/50 hover:bg-blue-200 text-blue-400 hover:text-blue-600';
  } else if (props.subject.category === 'comprehensive_application') {
      return 'bg-orange-100/50 hover:bg-orange-200 text-orange-400 hover:text-orange-600';
  } else if (props.subject.category === 'computer_science') {
      return 'bg-emerald-100/50 hover:bg-emerald-200 text-emerald-400 hover:text-emerald-600';
  }
  return 'bg-slate-100 hover:bg-slate-200 text-slate-400';
};

const getTooltip = (task) => {
  const statusStr = getTaskStatus(task) === 'completed' ? '已完成' : 
                    getTaskStatus(task) === 'overdue' ? '超时未完成!' : '待学习';
  const typeStr = task.type === 'practice' ? '[刷题]' : '[课程]';
  return `${typeStr} 日期: ${task.date}\n内容: ${task.moduleName}\n状态: ${statusStr}`;
};
</script>

<template>
  <div 
    :class="[
      'rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full border relative overflow-hidden group',
      categoryConfig.bgClass || 'bg-white',
      categoryConfig.borderClass || 'border-slate-100'
    ]"
  >
    
    <!-- Top Border Line -->
    <div :class="['absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r opacity-80', categoryConfig.colorClass || 'from-gray-100 to-gray-200']"></div>

    <!-- Header -->
    <div class="flex justify-between items-start mb-4 relative z-10">
      <div class="flex items-start gap-3">
        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm', categoryConfig.iconClass || 'bg-slate-100 text-slate-500']">
          {{ subject.name.substring(0,1) }}
        </div>
        <div>
          <h3 :class="['font-bold text-lg leading-tight mb-1', categoryConfig.textClass || 'text-slate-800']">{{ subject.name }}</h3>
          <div class="flex items-center gap-2">
            <span :class="['text-[10px] px-1.5 py-0.5 rounded border font-medium', categoryConfig.badgeClass || 'bg-slate-50 border-slate-100 text-slate-500']">
              {{ categoryConfig.name || '通用' }}
            </span>
          </div>
        </div>
      </div>
      <!-- Lesson Percentage -->
      <div class="flex flex-col items-end">
        <div class="text-xs text-slate-400 font-medium mb-0.5">课程进度</div>
        <div class="text-xl font-black text-slate-700 leading-none">{{ lessonPercentage }}<span class="text-sm text-slate-400 font-normal ml-0.5">%</span></div>
      </div>
    </div>

    <!-- Lesson Progress Bar -->
    <div class="w-full bg-white/50 rounded-full h-1.5 mb-4 overflow-hidden ring-1 ring-black/5" title="课程进度">
      <div 
        :class="['h-full rounded-full transition-all duration-1000 ease-out', categoryConfig.barClass || 'bg-slate-400']"
        :style="{ width: `${lessonPercentage}%` }"
      ></div>
    </div>

    <!-- Lesson Grid -->
    <div class="flex-1 mb-4">
        <div v-if="lessonTasks.length > 0" class="flex flex-wrap gap-1.5 content-start">
            <div 
            v-for="task in lessonTasks" 
            :key="task.id"
            @click="emit('toggle', task.id)"
            :class="['w-7 h-7 rounded-[4px] cursor-pointer transition-all duration-200 text-[9px] flex items-center justify-center font-bold select-none', getSquareClass(task)]"
            :title="getTooltip(task)"
            >
            {{ task.index }}
            </div>
        </div>
        <div v-else class="text-xs text-slate-400 italic py-2">无课程安排</div>
    </div>

    <!-- Practice Section (New) -->
    <div v-if="practiceTasks.length > 0" class="mt-auto border-t border-black/5 pt-3">
        <div class="flex justify-between items-end mb-2">
            <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-600">📝 刷题任务</span>
                <span class="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500" title="已完成题目数 / 总目标题目数">
                    {{ practiceCompletedQuestions }} / {{ practiceTotalQuestions }} 题
                </span>
            </div>
            <div class="text-[10px] text-slate-400">{{ practiceCompletedItems }} / {{ practiceTotalItems }} 任务</div>
        </div>
        
        <!-- Practice Progress Bar -->
        <div class="w-full bg-white/50 rounded-full h-1.5 mb-3 overflow-hidden ring-1 ring-black/5">
            <div 
                class="h-full rounded-full transition-all duration-1000 ease-out bg-indigo-400"
                :style="{ width: `${practicePercentage}%` }"
            ></div>
        </div>

        <!-- Practice Dots (Compact view) -->
        <!-- Just showing last 7 days or overdue + next few? Showing all might be too much. 
             Let's show a mini grid but smaller dots. -->
        <div class="flex flex-wrap gap-1">
             <div 
                v-for="task in practiceTasks" 
                :key="task.id"
                @click="emit('toggle', task.id)"
                :class="[
                    'w-2 h-2 rounded-full cursor-pointer transition-all duration-200', 
                    getTaskStatus(task) === 'completed' ? 'bg-emerald-400' : 
                    getTaskStatus(task) === 'overdue' ? 'bg-rose-400 animate-pulse' : 'bg-slate-200 hover:bg-indigo-300'
                ]"
                :title="getTooltip(task)"
            ></div>
        </div>
    </div>

    <div class="mt-3 text-xs text-slate-400/80 line-clamp-1 italic" :title="subject.remarks">
      {{ subject.remarks }}
    </div>
  </div>
</template>