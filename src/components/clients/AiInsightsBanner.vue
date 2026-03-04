<template>
  <div v-if="!loading && retentionInsights.length > 0" class="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/30 to-slate-900 p-6 shadow-lg mb-6">
    <div class="absolute top-0 right-0 p-32 opacity-10 bg-gradient-to-bl from-primary to-transparent rounded-full blur-3xl pointer-events-none"></div>
    <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      
      <div class="flex flex-col gap-3 max-w-2xl">
        <div class="flex items-center gap-2">
          <span class="text-indigo-400 text-xl">✨</span>
          <h3 class="text-lg font-semibold text-white tracking-wide">Análise de Retenção IA</h3>
        </div>
        
        <p v-if="criticalInsight" class="text-slate-300 text-base leading-relaxed">
          {{ criticalInsight.description }}
        </p>
        <p v-else class="text-slate-300 text-base leading-relaxed">
          Nenhum cliente em situação altamente crítica relatado hoje. Continue o bom trabalho!
        </p>
      </div>
      
      <div class="flex-shrink-0 mt-4 md:mt-0 self-end md:self-auto">
        <router-link to="/ai-insights" class="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors group">
          Ver todos na Central Githa AI 
          <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { aiService } from '@/services/aiService';

const loading = ref(true);
const retentionInsights = ref([]);

// We pick the most critical one or the first one to highlight in the banner
const criticalInsight = computed(() => {
  if (retentionInsights.value.length === 0) return null;
  return retentionInsights.value[0];
});

const loadInsights = async () => {
  loading.value = true;
  try {
    const response = await aiService.getDashboardInsights({ page: 0, size: 5, sort: 'createdAt,desc' });
    const allInsights = response.data.content || [];
    
    // Filter to show only retention alerts as seen in the legacy App
    retentionInsights.value = allInsights.filter(i => i.type && i.type.includes('RETENTION'));
  } catch (error) {
    console.error('Failed to load AI retention insights:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadInsights();
});
</script>
