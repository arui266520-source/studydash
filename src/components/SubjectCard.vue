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

const total = computed(() => props.tasks.length);
const completedCount = computed(() => props.tasks.filter(t => props.completedIds.has(t.id)).length);
const percentage = computed(() => total.value === 0 ? 0 : Math.round((completedCount.value / total.value) * 100));

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
  // Use category specific colors for pending state instead of plain gray
  if (props.subject.category === 'vocational_aptitude_test') {
      return 'bg-blue-100/50 hover:bg-blue-200 text-blue-400 hover:text-blue-600';
  } else if (props.subject.category === 'comprehensive_application') {
      return 'bg-orange-100/50 hover:bg-orange-200 text-orange-400 hover:text-orange-600';
  }
  return 'bg-slate-100 hover:bg-slate-200 text-slate-400';
};

const getTooltip = (task) => {
  const statusStr = getTaskStatus(task) === 'completed' ? '已完成' : 
                    getTaskStatus(task) === 'overdue' ? '超时未完成!' : '待学习';
  return `日期: ${task.date}\n内容: ${task.courseInstitution} - ${task.moduleName}\n状态: ${statusStr}`;
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
    
    <!-- Top Border Line (Stronger visual cue) -->
    <div :class="['absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r opacity-80', categoryConfig.colorClass || 'from-gray-100 to-gray-200']"></div>

    <div class="flex justify-between items-start mb-4 relative z-10">
      <div class="flex items-start gap-3">
        <!-- Icon placeholder -->
        <div :class="['w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm', categoryConfig.iconClass || 'bg-slate-100 text-slate-500']">
          {{ subject.name.substring(0,1) }}
        </div>
        <div>
          <h3 :class="['font-bold text-lg leading-tight mb-1', categoryConfig.textClass || 'text-slate-800']">{{ subject.name }}</h3>
          <div class="flex items-center gap-2">
            <span :class="['text-[10px] px-1.5 py-0.5 rounded border font-medium', categoryConfig.badgeClass || 'bg-slate-50 border-slate-100 text-slate-500']">
              {{ categoryConfig.name || '通用' }}
            </span>
            <p class="text-xs text-slate-400 font-medium">{{ completedCount }}/{{ total }} 完成</p>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-end">
        <div class="text-2xl font-black text-slate-700 leading-none">{{ percentage }}<span class="text-sm text-slate-400 font-normal ml-0.5">%</span></div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="w-full bg-white/50 rounded-full h-2 mb-5 overflow-hidden ring-1 ring-black/5">
      <div 
        :class="['h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]', categoryConfig.barClass || 'bg-slate-400']"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>

    <!-- Grid -->
    <div class="flex-1">
      <div class="flex flex-wrap gap-1.5 content-start">
        <div 
          v-for="task in tasks" 
          :key="task.id"
          @click="emit('toggle', task.id)"
          :class="['w-7 h-7 rounded-[4px] cursor-pointer transition-all duration-200 text-[9px] flex items-center justify-center font-bold select-none', getSquareClass(task)]"
          :title="getTooltip(task)"
        >
          {{ task.index }}
        </div>
      </div>
    </div>

    <div class="mt-4 text-xs text-slate-400/80 border-t border-black/5 pt-2 line-clamp-2 italic" :title="subject.remarks">
      {{ subject.remarks }}
    </div>
  </div>
</template>
