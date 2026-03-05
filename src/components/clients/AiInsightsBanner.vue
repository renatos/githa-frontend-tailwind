<template>
  <div
    v-if="!loading && hasData"
    class="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/30 to-slate-900 p-5 shadow-lg mb-6"
  >
    <!-- glow decoration -->
    <div class="absolute top-0 right-0 p-32 opacity-10 bg-gradient-to-bl from-primary to-transparent rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

      <div class="flex flex-col gap-3 max-w-2xl">
        <div class="flex items-center gap-2">
          <span class="text-indigo-400 text-xl">✨</span>
          <h3 class="text-base font-semibold text-white tracking-wide">Análise de Retenção IA</h3>
        </div>

        <!-- Official AI Text Insight -->
        <p v-if="aiDescription" class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {{ aiDescription }}
        </p>

        <!-- Enriched data from AT_RISK Query -->
        <div v-if="atRiskCount > 0" class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {{ atRiskCount }} cliente{{ atRiskCount !== 1 ? 's' : '' }} em risco
          </span>
          
          <template v-if="criticalClient">
            <span>•</span>
            <span class="text-slate-300">
              Caso mais crítico: <span class="font-medium text-white">{{ criticalClient.client.name }}</span>
            </span>
            <span v-if="criticalDaysSince" class="text-amber-400">
              ({{ criticalDaysSince }} dias ausente)
            </span>
          </template>
        </div>

        <!-- All clear state -->
        <p v-if="!aiDescription && atRiskCount === 0" class="text-slate-300 text-sm leading-relaxed">
          Nenhum cliente em situação altamente crítica relatado hoje. Continue o bom trabalho! 🎉
        </p>
      </div>

      <div class="flex-shrink-0 mt-3 md:mt-0 self-start md:self-center">
        <router-link
          to="/ai-insights"
          class="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors group px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20"
        >
          Central Githa AI
          <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { aiService } from '@/services/aiService';
import api from '@/services/api';

const loading = ref(true);

// AI free-text (official insight)
const aiDescription = ref('');

// AT_RISK clients data (enrichment)
const atRiskCount = ref(0);
const criticalClient = ref(null);
const criticalDaysSince = ref(null);

const hasData = computed(() => aiDescription.value || atRiskCount.value > 0);

/**
 * Calculate days since a date string.
 */
function daysSince(dateStr) {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

const loadInsights = async () => {
  loading.value = true;
  try {
    // 1. Load official AI insight text
    try {
      const aiResp = await aiService.getDashboardInsights({ page: 0, size: 5, sort: 'createdAt,desc' });
      const allInsights = aiResp.data.content || [];
      const retention = allInsights.filter(i => i.type && i.type.includes('RETENTION'));
      if (retention.length > 0) {
        aiDescription.value = retention[0].description ?? '';
      }
      
    } catch (e) {
      console.warn('Could not load AI text insights', e);
    }

    // 2. Fetch AT_RISK client stats for enrichment
    try {
      const statsResp = await api.get('/reports/client-statistics', {
        params: {
          'client.status': 'AT_RISK',
          page: 0,
          size: 1,
          sort: 'lastVisitDate,asc', // oldest visit first
        }
      });
      const page = statsResp.data;
      atRiskCount.value = page.totalElements ?? 0;

      if (page.content && page.content.length > 0) {
        const top = page.content[0];
        criticalClient.value = top;
        criticalDaysSince.value = daysSince(top.lastVisitDate);
      }
    } catch (e) {
      console.warn('Could not load AT_RISK stats for enrichment', e);
    }
    
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadInsights();
});
</script>
