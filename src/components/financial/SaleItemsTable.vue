<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Itens da Venda</h4>
      <div v-if="autoFilledMessage" class="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-in fade-in slide-in-from-right-2">
        <i class="fa-solid fa-circle-check text-indigo-400 text-[10px]"></i>
        <small class="text-indigo-300 text-[10px] font-medium">{{ autoFilledMessage }}</small>
      </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-800 bg-slate-900">
            <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12 text-center">Tipo</th>
            <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Item</th>
            <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-20 text-center">Qtd</th>
            <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-32 text-right">Unitário</th>
            <th class="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-32 text-right">Total</th>
            <th class="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/50">
          <!-- Existing Items -->
          <tr v-for="(item, index) in items" :key="item.id || index" class="group/row hover:bg-slate-800/30 transition-colors">
            <td class="px-4 py-3 text-center">
              <div class="flex items-center justify-center">
                <i v-if="item.type === 'PRODUCT'" class="fa-solid fa-box text-amber-500/80 text-lg" title="Produto"></i>
                <i v-else class="fa-solid fa-hand-sparkles text-indigo-400 text-lg" title="Serviço"></i>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col">
                <span class="text-slate-200 font-medium text-sm">
                  {{ item.type === 'PRODUCT' ? item.productName : item.serviceName }}
                </span>
                <span v-if="item.professionalName" class="text-slate-500 text-[11px] flex items-center gap-1">
                  <i class="fa-solid fa-user-tie text-[9px]"></i>
                  {{ item.professionalName }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-center">
              <span class="text-slate-300 text-sm font-medium bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {{ item.quantity }}
              </span>
            </td>
            <td class="px-4 py-3 text-right text-slate-400 text-sm">
              {{ formatCurrency(item.unitPrice) }}
            </td>
            <td class="px-4 py-3 text-right text-emerald-400 font-bold text-sm">
              {{ formatCurrency(item.unitPrice * item.quantity) }}
            </td>
            <td class="px-4 py-3 text-center">
              <button 
                v-if="canSave" 
                @click="$emit('removeItem', index)"
                class="opacity-0 group-hover/row:opacity-100 p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Remover item"
              >
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="items.length === 0" class="border-none">
            <td colspan="6" class="px-4 py-8 text-center text-slate-600 italic text-sm">
              Nenhum item adicionado à venda
            </td>
          </tr>

          <!-- Add New Item Row -->
          <tr v-if="canSave" class="bg-indigo-600/5 border-t border-indigo-500/20">
            <td class="px-3 py-4 text-center">
              <div class="relative group">
                <select 
                  v-model="newItem.type" 
                  class="appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full cursor-pointer transition-all"
                  @change="$emit('typeChange', newItem.type)"
                >
                  <option v-for="type in saleItemTypes" :key="type.name" :value="type.name">
                    {{ type.name === 'PRODUCT' ? '📦 Prod' : '💇 Serv' }}
                  </option>
                </select>
                <i class="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 pointer-events-none group-hover:text-slate-400"></i>
              </div>
            </td>
            <td class="px-3 py-4">
              <div class="flex flex-col gap-2">
                <BaseLookup
                  v-if="newItem.type === 'PRODUCT'"
                  v-model="newItem.productId"
                  :initial-description="newItem.productName"
                  :search-service="productServiceAdapter"
                  placeholder="Selecione o produto..."
                  hide-id
                  @select="onProductSelect"
                />
                <div v-else class="flex flex-col lg:flex-row gap-2">
                  <div class="flex-1 min-w-0">
                    <BaseLookup
                      v-model="newItem.serviceId"
                      :initial-description="newItem.serviceName"
                      :search-service="serviceService"
                      placeholder="Serviço..."
                      hide-id
                      @select="onServiceSelect"
                    />
                  </div>
                  <div v-if="newItem.serviceId" class="w-full lg:w-48 xl:w-56 flex-shrink-0">
                    <BaseLookup
                      v-model="newItem.professionalId"
                      :initial-description="newItem.professionalName"
                      :search-service="professionalService"
                      placeholder="Profissional..."
                      hide-id
                      @select="onProfessionalSelect"
                    />
                  </div>
                </div>
              </div>
            </td>
            <td class="px-3 py-4">
              <input 
                v-model="newItem.quantity" 
                type="number" 
                min="1" 
                inputmode="numeric"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-center text-sm text-indigo-400 font-bold focus:ring-1 focus:ring-indigo-500 outline-none border-dashed"
              >
            </td>
            <td class="px-3 py-4">
              <CurrencyInput 
                v-model="newItem.unitPrice" 
                class="text-right"
              />
            </td>
            <td class="px-3 py-4 text-right">
              <div class="text-emerald-400 font-bold text-sm">
                {{ formatCurrency(newItem.unitPrice * newItem.quantity) }}
              </div>
            </td>
            <td class="px-3 py-4 text-center">
              <button
                :disabled="!isItemValid"
                @click="onAddItem"
                class="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-20 disabled:scale-90 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                title="Adicionar item"
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import BaseLookup from '../common/BaseLookup.vue';
import CurrencyInput from '../common/CurrencyInput.vue';

const props = defineProps({
  items: { type: Array, required: true },
  canSave: { type: Boolean, default: true },
  saleItemTypes: { type: Array, default: () => [] },
  productServiceAdapter: { type: Object, required: true },
  serviceService: { type: Object, required: true },
  professionalService: { type: Object, required: true },
  autoFilledMessage: { type: String, default: '' }
});

const emit = defineEmits(['addItem', 'removeItem', 'typeChange']);

const newItem = ref({
  type: 'PRODUCT',
  productId: null,
  productName: '',
  serviceId: null,
  serviceName: '',
  unitPrice: 0,
  professionalId: null,
  professionalName: '',
  appointmentId: null,
  quantity: 1
});

const isItemValid = computed(() => {
  if (newItem.value.type === 'PRODUCT') return !!newItem.value.productId;
  if (newItem.value.type === 'SERVICE') return !!newItem.value.serviceId && !!newItem.value.professionalId;
  return false;
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const onProductSelect = (item) => {
  if (!item) return;
  const cleanName = item.name.replace(/ \(Estoque: \d+\)$/, '');
  newItem.value.productId = item.id;
  newItem.value.productName = cleanName;
  newItem.value.unitPrice = item.price || 0;
};

const onServiceSelect = (item) => {
  if (!item) return;
  newItem.value.serviceId = item.id;
  newItem.value.serviceName = item.name;
  newItem.value.unitPrice = item.price || 0;
};

const onProfessionalSelect = (item) => {
  if (!item) return;
  newItem.value.professionalId = item.id;
  newItem.value.professionalName = item.name;
};

const onAddItem = () => {
  emit('addItem', { ...newItem.value });
  resetNewItem();
};

const resetNewItem = () => {
  newItem.value = {
    type: newItem.value.type,
    productId: null,
    productName: '',
    serviceId: null,
    serviceName: '',
    unitPrice: 0,
    professionalId: null,
    professionalName: '',
    appointmentId: null,
    quantity: 1
  };
};

const setItemData = (data) => {
    Object.assign(newItem.value, data);
};

defineExpose({ setItemData });
</script>
