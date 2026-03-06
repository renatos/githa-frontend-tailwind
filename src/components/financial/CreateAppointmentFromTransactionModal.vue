<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300">
      
      <!-- Modal Header -->
      <div class="shrink-0 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <i class="fa-solid fa-calendar-plus text-indigo-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold tracking-tight text-white">Gerar Atendimento</h3>
            <p class="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">Vincular Transação</p>
          </div>
        </div>
        <button 
          @click="$emit('close')" 
          type="button"
          class="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
        >
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <form @submit.prevent="submit" class="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 min-h-0">
        
        <!-- Procedimento -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Procedimento *</label>
          <BaseLookup
            v-model="form.serviceId"
            :initial-description="initialServiceName"
            :search-service="serviceService"
            placeholder="Pesquisar Procedimento..."
            @select="onServiceSelect"
          />
        </div>

        <!-- Profissional -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Profissional *</label>
          <BaseLookup
            v-model="form.professionalId"
            :initial-description="initialProfessionalName"
            :search-service="professionalService"
            placeholder="Pesquisar Profissional..."
            @select="onProfessionalSelect"
          />
        </div>

        <!-- Descrição -->
        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Descrição</label>
          <div class="relative group">
            <i class="fa-solid fa-pen-nib absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors"></i>
            <input 
              v-model="form.description" 
              placeholder="Descrição do atendimento..."
              class="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-slate-200 placeholder:text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <!-- Tipo e Desconto -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Tipo</label>
            <div class="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-600 font-bold flex items-center gap-2 grayscale border-dashed opacity-50">
               <i class="fa-solid fa-arrow-up text-emerald-500"></i>
               RECEITA
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Desconto (%)</label>
            <div class="relative group">
              <i class="fa-solid fa-percent absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors"></i>
              <input 
                v-model.number="form.discount" 
                type="number" 
                step="0.01"
                class="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Valores -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Valor Procedimento</label>
            <div class="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-400 font-black tracking-tight flex items-center gap-2">
               {{ formatCurrency(computedValue) }}
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1 text-indigo-400">Pagamento *</label>
            <CurrencyInput 
              v-model="form.amount" 
              required
              class="w-full font-black text-emerald-400"
            />
          </div>
        </div>
      </form>

      <!-- Modal Footer -->
      <div class="shrink-0 p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row gap-3 items-center justify-between backdrop-blur-md">
        <button 
          type="button" 
          @click="$emit('close')"
          class="w-full sm:flex-1 py-4 rounded-2xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
        >
          Cancelar
        </button>
        <button 
          @click="submit"
          :disabled="loading"
          class="w-full sm:flex-[2] py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
        >
          {{ loading ? 'Salvando...' : 'Gerar Atendimento' }}
        </button>
      </div>
    </div>

    <!-- Error Modal Portal -->
    <ErrorModal
        :message="errorMessage"
        :show="showError"
        @close="closeError"
    />
    </div>
  </Teleport>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue';
import BaseLookup from '../common/BaseLookup.vue';
import CurrencyInput from '../common/CurrencyInput.vue';
import ErrorModal from '../common/ErrorModal.vue';
import financialService from '../../services/financialService';
import {serviceService} from '../../services/serviceService';
import {professionalService} from '../../services/professionalService';
import {useEscapeKey} from '../../composables/useEscapeKey';

const props = defineProps({
  transaction: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'save']);

// Add ESC key support
useEscapeKey(() => emit('close'));

const loading = ref(false);
const form = ref({
  serviceId: null,
  professionalId: null,
  discount: 0,
  amount: null,
  description: ''
});

const selectedService = ref(null);
const selectedProfessional = ref(null);

const initialServiceName = ref('');
const initialProfessionalName = ref('');

// Error state
const showError = ref(false);
const errorMessage = ref('');

const closeError = () => {
  showError.value = false;
  errorMessage.value = '';
};

onMounted(() => {
  if (props.transaction.professionalId) {
    form.value.professionalId = props.transaction.professionalId;
    initialProfessionalName.value = props.transaction.professionalName;
  }
  form.value.amount = null;
  form.value.description = `Procedimento - ${props.transaction.clientName || 'Cliente'}`;
});

const onServiceSelect = (service) => {
  selectedService.value = service;
};

const onProfessionalSelect = (professional) => {
  selectedProfessional.value = professional;
};

const computedValue = computed(() => {
  if (!selectedService.value) return 0;
  return selectedService.value.price || 0;
});

watch([() => selectedService.value, () => form.value.discount], () => {
  if (!selectedService.value) {
    form.value.amount = null;
  } else {
    const price = selectedService.value.price || 0;
    const discount = form.value.discount || 0;
    const calculated = price * (1 - discount / 100);
    form.value.amount = parseFloat(calculated.toFixed(2));
  }
});

watch(() => selectedService.value, (newService) => {
  if (newService) {
    form.value.description = `${newService.name} - ${props.transaction.clientName || 'Cliente'}`;
  }
});

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(val);
};

const submit = async () => {
  if (!form.value.serviceId || !form.value.professionalId || !form.value.amount) {
    showError.value = true;
    errorMessage.value = 'Preencha todos os campos obrigatórios.';
    return;
  }

  loading.value = true;
  try {
    await financialService.createAppointmentFromTransaction(props.transaction.id, {
      serviceId: form.value.serviceId,
      professionalId: form.value.professionalId,
      discount: form.value.discount,
      amount: form.value.amount,
      description: form.value.description
    });
    emit('save');
  } catch (error) {
    showError.value = true;
    errorMessage.value = 'Erro ao gerar atendimento: ' + (error.response?.data?.message || error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Legado CSS removido em favor do Tailwind CSS */
</style>
