<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300">
      
      <!-- Modal Header -->
      <div class="shrink-0 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <i class="fa-solid fa-money-bill-transfer text-indigo-400"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold tracking-tight text-white">
              {{ transaction.id ? 'Editar Transação' : 'Nova Transação' }}
            </h3>
            <p v-if="transaction.id" class="text-xs text-slate-500 truncate max-w-[200px] md:max-w-none">
              Ref: {{ transaction.id }}
            </p>
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

      <div class="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-900/30 min-h-0">
        <form @submit.prevent="save" class="space-y-8">
          
          <!-- Lançamento Mode Selector -->
          <div v-if="!transaction.id" class="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              v-for="mode in [{id:'MANUAL', label:'Lançamento Manual', icon:'fa-keyboard'}, {id:'SALE', label:'Venda de Produtos/Serviços', icon:'fa-cart-shopping'}]"
              :key="mode.id"
              type="button"
              @click="launchMode = mode.id"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300"
              :class="launchMode === mode.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-500 hover:text-slate-300'"
            >
              <i class="fa-solid" :class="mode.icon"></i>
              {{ mode.label }}
            </button>
          </div>

          <!-- Description Section -->
          <div v-if="launchMode === 'MANUAL'" class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Descrição</label>
            <div class="relative group">
              <i class="fa-solid fa-signature absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors"></i>
              <input 
                v-model="form.description" 
                :disabled="!canSave"
                placeholder="Ex: Aluguel mensal, Compra de suprimentos..."
                class="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-slate-200 placeholder:text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <!-- SALE MODE: Client Selection -->
          <div v-if="launchMode === 'SALE'" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Cliente</label>
              <BaseLookup
                v-model="form.clientId"
                :disabled="!canSave"
                :initial-description="form.clientName"
                :search-service="clientService"
                placeholder="Pesquisar cliente..."
                @select="onClientSelect"
              />
            </div>

            <!-- SALE MODE: Items Table -->
            <SaleItemsTable 
              ref="saleItemsTableRef"
              :items="saleItems"
              :can-save="canSave"
              :sale-item-types="saleItemTypes"
              :product-service-adapter="productServiceAdapter"
              :service-service="serviceService"
              :professional-service="professionalService"
              :auto-filled-message="autoFilledMessage"
              @add-item="addSaleItem"
              @remove-item="removeSaleItem"
            />
          </div>

          <!-- Account Group Selection (Manual Mode) -->
          <div v-if="!isAppointmentTransaction && launchMode === 'MANUAL'" class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Grupo de Contas</label>
            <BaseLookup
              v-model="form.accountGroupId"
              :disabled="!canSave"
              :initial-description="form.accountGroupName"
              :search-service="accountGroupServiceAdapter"
              placeholder="Ex: Custos de Operação, Investimentos..."
              @select="onAccountGroupSelect"
            />
          </div>

          <!-- Payment Info (Visible for Income) -->
          <div v-if="form.nature === 'INCOME'" class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Forma de Pagamento</label>
            <BaseLookup
              v-model="form.paymentMethodId"
              :disabled="!canSave"
              :initial-description="form.paymentMethodName"
              :search-service="paymentMethodService"
              placeholder="Selecione o método..."
              @select="onPaymentMethodSelect"
            />
          </div>

          <!-- Financial Details Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div v-if="launchMode === 'MANUAL'" class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Natureza</label>
              <div class="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-400 font-semibold flex items-center gap-2 opacity-60 grayscale cursor-not-allowed">
                <i class="fa-solid" :class="form.nature === 'INCOME' ? 'fa-arrow-up text-emerald-500' : 'fa-arrow-down text-rose-500'"></i>
                {{ form.nature === 'INCOME' ? 'Receita' : 'Despesa' }}
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Valor Total</label>
              <div class="relative group text-indigo-400">
                <CurrencyInput 
                  v-model="form.amount" 
                  :disabled="!canSave" 
                  class="font-black"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Status</label>
              <select 
                v-model="form.status" 
                :disabled="!canSave"
                class="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option v-for="status in transactionStatuses" :key="status.name" :value="status.name">
                  {{ status.description }}
                </option>
              </select>
            </div>
          </div>

          <!-- Linked Appointment Info -->
          <div v-if="isAppointmentTransaction" class="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-indigo-500/20">
                <i class="fa-solid fa-calendar-check text-indigo-400"></i>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Vínculo</span>
                <span class="text-sm font-semibold text-slate-200">Vinculado ao Agendamento #{{ form.appointmentId }}</span>
              </div>
            </div>
            <button 
              type="button" 
              @click="viewAppointment"
              class="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
            >
              Ver Detalhes
            </button>
          </div>

          <!-- Discount Preview -->
          <TransactionDiscountBadge 
            v-if="selectedPaymentMethod"
            :amount="form.amount"
            :payment-method="selectedPaymentMethod"
          />

          <!-- Secondary Details Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Categoria (Opcional)</label>
              <input 
                v-model="form.category" 
                :disabled="!canSave"
                placeholder="Ex: Hardware, Freelance..."
                class="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Data da Transação</label>
              <input 
                v-model="form.paymentDate" 
                :disabled="!canSave" 
                type="datetime-local" 
                step="1"
                class="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="shrink-0 p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row gap-4 items-center justify-between backdrop-blur-md">
        <div v-show="!canSave" class="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <i class="fa-solid fa-lock text-rose-500 text-xs"></i>
          <span class="text-[10px] font-bold text-rose-300 uppercase leading-none">{{ saveTooltip }}</span>
        </div>
        <div v-show="canSave" class="hidden sm:block"></div>
        
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button" 
            @click="$emit('close')"
            class="flex-1 sm:px-8 py-3.5 rounded-2xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button 
            @click="save"
            :disabled="!canSave"
            class="flex-[2] sm:px-12 py-3.5 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-20 disabled:grayscale disabled:scale-95"
          >
            Salvar Transação
          </button>
        </div>
      </div>
    </div>
  </div>
</Teleport>
</template>


<script setup>
import {ref, defineProps, defineEmits, onMounted, computed, watch} from 'vue';
import financialService from '../../services/financialService';
import {authService} from '../../services/authService';
import {useEscapeKey} from '../../composables/useEscapeKey';
import CurrencyInput from '../common/CurrencyInput.vue';
import BaseLookup from '../common/BaseLookup.vue';
import paymentMethodService from '../../services/paymentMethodService';
import {clientService} from '../../services/clientService';
import productService from '../../services/productService';
import {appointmentService} from '../../services/appointmentService';
import {enumService} from '../../services/enumService';
import {serviceService} from '../../services/serviceService';
import {professionalService} from '../../services/professionalService';
import {saleService} from '../../services/saleService';

// Sub-components
import SaleItemsTable from './SaleItemsTable.vue';
import TransactionDiscountBadge from './TransactionDiscountBadge.vue';

const props = defineProps({
  transaction: {type: Object, default: () => ({})}
});

const emit = defineEmits(['close', 'save', 'view-appointment']);

// Add ESC key support
useEscapeKey(() => emit('close'));

const isAdmin = ref(false);
const originalStatus = ref('');
const transactionStatuses = ref([]);
const saleItemTypes = ref([]);
const accountNatures = ref([]);
const saleItemsTableRef = ref(null);

const checkUserRole = () => {
  const user = authService.getCurrentUser();
  isAdmin.value = (user.roles && user.roles.includes('ADMIN')) || user.email === 'admin@githa.com';
};

const launchMode = ref('SALE'); // 'MANUAL' or 'SALE'

const form = ref({
  description: '',
  amount: 0,
  nature: 'INCOME',
  status: 'PENDING',
  category: undefined,
  paymentDate: '',
  accountGroupId: undefined,
  accountGroupName: '',
  paymentMethodId: undefined,
  paymentMethodName: '',
  clientId: undefined,
  clientName: '',
  active: true
});

const saleItems = ref([]);
const autoFilledMessage = ref('');
const selectedPaymentMethod = ref(null);
const accountGroups = ref([]);

// Product lookup adapter
const productServiceAdapter = {
  getAll: async (params) => {
    const response = await productService.getAll(params);
    let data = Array.isArray(response.data) ? response.data : (response.data?.content ?? []);
    data = data.filter(p => p.active);
    if (params?.name) {
      const lower = params.name.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(lower));
    }
    const enriched = data.map(p => ({
      ...p,
      name: `${p.name} (Estoque: ${p.stockQuantity ?? 0})`
    }));
    return { data: { content: enriched, totalElements: enriched.length } };
  },
  getById: async (id) => {
    const response = await productService.getById(id);
    const p = response.data;
    if (p) p.name = `${p.name} (Estoque: ${p.stockQuantity ?? 0})`;
    return { data: p };
  }
};

// Account group adapter
const accountGroupServiceAdapter = {
  getAll: async (params) => {
    const response = await financialService.getAccountGroups();
    let data = response.data.filter(group => group.active);
    if (params.name) {
      data = data.filter(g => g.name.toLowerCase().includes(params.name.toLowerCase()));
    }
    return { data: { content: data, totalElements: data.length } };
  },
  getById: async (id) => {
    const response = await financialService.getAccountGroups();
    return { data: response.data.find(g => g.id == id) };
  }
};

const canSave = computed(() => {
  if (!props.transaction.id) return true;
  if (originalStatus.value === 'PAID' && !isAdmin.value) return false;
  return true;
});

const saveTooltip = computed(() => {
  return !canSave.value ? 'Transação paga, apenas ADMIN pode salvar alterações.' : '';
});

onMounted(async () => {
  checkUserRole();
  transactionStatuses.value = await enumService.getOptions('TransactionStatus');
  saleItemTypes.value = await enumService.getOptions('SaleItemType');
  accountNatures.value = await enumService.getOptions('AccountNature');
  
  const groupsResponse = await financialService.getAccountGroups();
  accountGroups.value = groupsResponse.data.filter(g => g.active);

  if (props.transaction?.id) {
    form.value = {...props.transaction};
    originalStatus.value = props.transaction.status;

    if (props.transaction.saleId || props.transaction.sale) {
      launchMode.value = 'SALE';
      if (props.transaction.sale?.items) {
          saleItems.value = props.transaction.sale.items.map(item => ({
              ...item,
              type: item.type || (item.productId ? 'PRODUCT' : 'SERVICE')
          }));
      }
    } else {
      launchMode.value = 'MANUAL';
    }

    if (form.value.originalAmount) form.value.amount = form.value.originalAmount;
    if (form.value.paymentDate?.length > 16) form.value.paymentDate = form.value.paymentDate.substring(0, 19);
    
    // Recovery of names for lookups
    if (form.value.paymentMethodId) {
       const pmRes = await paymentMethodService.getById(form.value.paymentMethodId);
       if (pmRes.data) {
         selectedPaymentMethod.value = pmRes.data;
         form.value.paymentMethodName = pmRes.data.name;
       }
    }

    if (form.value.accountGroupId) {
       const group = accountGroups.value.find(g => g.id === form.value.accountGroupId);
       if (group) form.value.accountGroupName = group.name;
    }
  } else {
    // Default date
    const now = new Date();
    form.value.paymentDate = now.toISOString().substring(0, 19);
  }
});

const addSaleItem = (item) => {
  saleItems.value.push({...item, id: Date.now()});
  autoFilledMessage.value = '';
  calculateAmountFromItems();
};

const removeSaleItem = (index) => {
  saleItems.value.splice(index, 1);
  calculateAmountFromItems();
};

const calculateAmountFromItems = () => {
  const total = saleItems.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  form.value.amount = total;
  form.value.originalAmount = total;
};

const onClientSelect = (item) => {
  form.value.clientId = item.id;
  form.value.clientName = item.name;
  if (!form.value.description) form.value.description = `Venda para ${item.name}`;
  checkForUnbilledAppointments();
};

const checkForUnbilledAppointments = async () => {
    autoFilledMessage.value = '';
    if (launchMode.value === 'SALE' && form.value.clientId) {
        try {
            const response = await appointmentService.getAll({ 
                'client.id': form.value.clientId, 
                status: 'COMPLETED',
                size: 50
            });
            const unbilled = response.data.content.filter(apt => 
                !apt.transactionId && !saleItems.value.some(added => added.appointmentId === apt.id)
            );

            if (unbilled.length > 0) {
                const apt = unbilled[0];
                saleItemsTableRef.value?.setItemData({
                  type: 'SERVICE',
                  serviceId: apt.serviceId,
                  serviceName: apt.serviceName,
                  professionalId: apt.professionalId,
                  professionalName: apt.professionalName,
                  unitPrice: apt.price || apt.servicePrice || 0,
                  appointmentId: apt.id
                });
                autoFilledMessage.value = `Dados preenchidos automaticamente referentes a um agendamento para ${form.value.clientName.split(' ')[0]}.`;
            }
        } catch (error) { console.error(error); }
    }
};

const onAccountGroupSelect = (item) => {
  form.value.accountGroupId = item?.id;
  form.value.accountGroupName = item?.name || '';
  if (item?.nature) form.value.nature = item.nature;
  if (item && !form.value.description) form.value.description = item.name;
};

const onPaymentMethodSelect = (item) => {
  selectedPaymentMethod.value = item;
  form.value.paymentMethodId = item?.id;
  form.value.paymentMethodName = item?.name || '';
};

const save = async () => {
  if (form.value.status === 'PAID' && !form.value.accountGroupId && !form.value.appointmentId && launchMode.value === 'MANUAL') {
    alert('Selecione um Grupo de Contas para transações Pagas.');
    return;
  }

  if (launchMode.value === 'MANUAL') {
    if (!form.value.description) {
      alert('Descrição é obrigatória.');
      return;
    }
    emit('save', form.value);
    return;
  }

  if (launchMode.value === 'SALE') {
    if (!form.value.clientId) { alert('Cliente é obrigatório.'); return; }
    if (saleItems.value.length === 0) { alert('Adicione pelo menos um item.'); return; }

    try {
      const payload = {
        sale: {
          id: form.value.saleId,
          clientId: form.value.clientId,
          notes: form.value.description,
          items: saleItems.value.map(item => ({
            id: typeof item.id === 'number' && item.id > 1700000000000 ? null : item.id,
            type: item.type,
            productId: item.productId,
            serviceId: item.serviceId,
            professionalId: item.professionalId,
            appointmentId: item.appointmentId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        },
        transaction: {
          ...form.value,
          description: form.value.description || `Venda para ${form.value.clientName}`,
          nature: 'INCOME',
          amount: form.value.amount,
          originalAmount: form.value.amount
        }
      };
      await saleService.launchSale(payload);
      emit('save', {refresh: true});
    } catch (error) {
      alert('Erro ao lançar venda: ' + (error.response?.data?.message || error.message));
    }
  }
};

watch(() => form.value.amount, (newVal) => {
  if (!props.transaction?.id || form.value.amount !== props.transaction.amount) {
     form.value.originalAmount = newVal;
  }
});

const viewAppointment = () => {
  if (form.value.appointmentId) emit('view-appointment', form.value.appointmentId);
}

const isAppointmentTransaction = computed(() => !!form.value.appointmentId);

watch(() => form.value.status, (newVal) => {
  if (newVal !== 'PAID') {
     form.value.paymentMethodId = undefined;
     form.value.paymentMethodName = '';
     selectedPaymentMethod.value = null;
  }
});

watch(launchMode, (newVal) => {
  if (newVal === 'SALE') form.value.nature = 'INCOME';
  else if (!form.value.accountGroupId && !form.value.id) form.value.nature = 'EXPENSE';
});

watch(() => form.value.nature, (newVal) => {
  if (newVal === 'INCOME') {
     form.value.paymentMethodId = undefined;
     form.value.paymentMethodName = '';
     selectedPaymentMethod.value = null;
  }
});

watch(() => form.value.appointmentId, (newVal) => {
  if (newVal) form.value.nature = 'INCOME';
}, {immediate: true});
</script>

<style scoped>
/* Legado CSS removido em favor do Tailwind CSS para manter consistência com o Design Stitch Dark Mode Premium */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
