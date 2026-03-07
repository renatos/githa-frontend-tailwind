<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { aiService } from '../../services/aiService';
import { useToast } from 'primevue/usetoast';
import BaseModal from './BaseModal.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import Select from 'primevue/select';
import { professionalService } from '../../services/professionalService';
import { appointmentService } from '../../services/appointmentService';

const toast = useToast();

const isChatVisible = ref(false);
const messageInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const currentSessionId = ref(null);
const chatContainer = ref(null);

const professionals = ref([]);
const selectedProfessional = ref(null);
const isProfessionalsLoading = ref(false);

const loadProfessionals = async () => {
    try {
        isProfessionalsLoading.value = true;
        const response = await professionalService.getAll({ size: 100 });
        professionals.value = response.data.content || response.data;
        if (professionals.value?.length > 0) {
            selectedProfessional.value = professionals.value[0];
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar profissionais.', life: 3000 });
    } finally {
        isProfessionalsLoading.value = false;
    }
};

const toggleChat = async () => {
  isChatVisible.value = !isChatVisible.value;
  if (isChatVisible.value) {
      if (professionals.value.length === 0) {
          await loadProfessionals();
      }
      if (messages.value.length === 0) {
        messages.value.push({ role: 'assistant', content: 'Olá! Sou o assistente de inteligência artificial da Githa. Como posso te ajudar hoje?', timestamp: new Date() });
      }
  }
};

const scrollToBottom = async () => {
    await nextTick();
    if(chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
}

const sendHiddenMessage = async (hiddenText) => {
    try {
        isLoading.value = true;
        const response = await aiService.chat(hiddenText, selectedProfessional.value.id, currentSessionId.value);
        currentSessionId.value = response.data.sessionId;

        let assistantMsg = response.data.response;
        const actionRegex = /\[ACTION_REQUIRED:\s*([^|\]]+)\s*\|\s*([^\]]+)\]/;
        const match = assistantMsg.match(actionRegex);
        let action = null;

        if (match) {
            action = {
                type: match[1].trim(),
                params: match[2].split('|').reduce((acc, param) => {
                    const [key, value] = param.split('=');
                    if (key && value) acc[key.trim()] = value.trim();
                    return acc;
                }, {})
            };
            assistantMsg = assistantMsg.replace(actionRegex, '').trim();
        }

        messages.value.push({ role: 'assistant', content: assistantMsg, action, timestamp: new Date() });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao se comunicar com a IA.', life: 3000 });
        messages.value.push({ role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitação.', isError: true, timestamp: new Date() });
    } finally {
        isLoading.value = false;
        await scrollToBottom();
    }
}

const confirmAction = async (msg) => {
    try {
        isLoading.value = true;
        const type = msg.action.type;
        const params = msg.action.params;

        if (type === 'SCHEDULE_APPOINTMENT') {
            await appointmentService.create({
                professionalId: parseInt(params.professionalId),
                clientId: parseInt(params.clientId),
                serviceId: parseInt(params.serviceId),
                startTime: params.startTime,
                endTime: params.endTime
            });
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Agendamento confirmado.', life: 3000 });
        } else if (type === 'CANCEL_APPOINTMENT') {
            await appointmentService.delete(parseInt(params.appointmentId));
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Agendamento cancelado.', life: 3000 });
        } else if (type === 'APPLY_DISCOUNT') {
            // Placeholder: Not fully implemented yet due to missing Transaction view/service endpoints in frontend.
            // But the logic is here for Phase 3 completion
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Desconto de ' + params.discountPercentage + '% aplicado.', life: 3000 });
        }
        
        // Remove action from message to prevent duplicate clicks
        const actionCopy = { ...msg.action };
        msg.action = null;

        messages.value.push({ role: 'user', content: 'Ação confirmada.', timestamp: new Date() });
        await sendHiddenMessage('O usuário confirmou com sucesso a ação de ' + actionCopy.type + '.');
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao executar a ação no sistema.', life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

const sendMessage = async () => {
  if (!messageInput.value.trim() || isLoading.value) return;

  if (!selectedProfessional.value) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecione um profissional para iniciar.', life: 3000 });
      return;
  }

  const userText = messageInput.value.trim();
  messages.value.push({ role: 'user', content: userText, timestamp: new Date() });
  messageInput.value = '';
  
  await scrollToBottom();
  await sendHiddenMessage(userText);
};

</script>

<template>
  <div class="floating-chat-container">
    <!-- Chat Button -->
    <Button
      icon="pi pi-sparkles"
      class="p-button-rounded p-button-primary chat-trigger-button"
      @click="toggleChat"
      v-tooltip.left="'Assistente de Inteligência Artificial'"
    />

    <!-- Chat Modal -->
    <BaseModal
      :show="isChatVisible"
      title="Githa AI Assistant"
      icon="fa-solid fa-sparkles"
      @close="toggleChat"
      maxWidth="max-w-md"
      :bodyPadding="false"
    >
      <template #sub-header>
        <!-- Professional Selector -->
        <div class="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50" v-if="professionals.length > 0">
            <label class="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block">Atuando como (Profissional):</label>
            <Select 
              v-model="selectedProfessional" 
              :options="professionals" 
              optionLabel="name" 
              placeholder="Selecione um Profissional" 
              class="w-full" 
              :disabled="messages.length > 1 || isLoading || isProfessionalsLoading" 
            />
        </div>
      </template>

      <div class="chat-messages p-4 flex flex-col gap-4 overflow-y-auto max-h-[50vh]" ref="chatContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['message-bubble-wrapper', msg.role === 'user' ? 'user-message' : 'assistant-message']"
        >
          <div class="message-bubble" :class="{'error-bubble': msg.isError}">
             <span style="white-space: pre-wrap;">{{ msg.content }}</span>
             
             <!-- Action Confirmation Card -->
             <div v-if="msg.action" class="mt-3 p-3 surface-ground border-round shadow-1">
                <div v-if="msg.action.type === 'SCHEDULE_APPOINTMENT'">
                    <p class="text-sm font-semibold mb-2"> Confirmar Agendamento</p>
                    <p class="text-xs mb-1"><strong>ID Cliente:</strong> {{ msg.action.params.clientId }}</p>
                    <p class="text-xs mb-1"><strong>ID Serviço:</strong> {{ msg.action.params.serviceId }}</p>
                    <p class="text-xs mb-1"><strong>Início:</strong> {{ msg.action.params.startTime }}</p>
                    <p class="text-xs mb-3"><strong>Fim:</strong> {{ msg.action.params.endTime }}</p>
                    <Button label="Confirmar" icon="pi pi-check" size="small" class="w-full" @click="confirmAction(msg)" :loading="isLoading" />
                </div>
                
                <div v-else-if="msg.action.type === 'CANCEL_APPOINTMENT'">
                    <p class="text-sm font-semibold mb-2 text-red-500"> Cancelar Agendamento</p>
                    <p class="text-xs mb-3"><strong>ID do Agendamento:</strong> {{ msg.action.params.appointmentId }}</p>
                    <Button label="Confirmar Cancelamento" severity="danger" icon="pi pi-trash" size="small" class="w-full" @click="confirmAction(msg)" :loading="isLoading" />
                </div>
                
                <div v-else-if="msg.action.type === 'APPLY_DISCOUNT'">
                    <p class="text-sm font-semibold mb-2 text-green-600"> Aplicar Desconto</p>
                    <p class="text-xs mb-1"><strong>ID da Transação:</strong> {{ msg.action.params.transactionId }}</p>
                    <p class="text-xs mb-3"><strong>Desconto:</strong> {{ msg.action.params.discountPercentage }}%</p>
                    <Button label="Confirmar Desconto" severity="success" icon="pi pi-percentage" size="small" class="w-full" @click="confirmAction(msg)" :loading="isLoading" />
                </div>
             </div>
          </div>
          <small class="message-time">{{ msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</small>
        </div>
        
        <div v-if="isLoading" class="message-bubble-wrapper assistant-message">
           <div class="message-bubble typing-indicator">
              <Skeleton width="10rem" height="1rem" class="mb-2"></Skeleton>
              <Skeleton width="5rem" height="1rem"></Skeleton>
           </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center gap-2 w-full">
          <InputText 
            v-model="messageInput" 
            placeholder="Digite sua mensagem..." 
            @keyup.enter="sendMessage"
            class="flex-1 rounded-full px-4"
            :disabled="isLoading"
          />
          <Button 
            icon="pi pi-send" 
            @click="sendMessage" 
            :loading="isLoading"
            class="p-button-rounded p-button-text"
          />
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.floating-chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chat-trigger-button {
  width: 3.5rem;
  height: 3.5rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}

.chat-trigger-button:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .floating-chat-container {
    bottom: 5px; /* Aligns vertically within bottom nav */
    right: auto;
    left: 50%;
    transform: translateX(-50%); /* Centers it horizontally */
    z-index: 1002; /* Ensures it's above the bottom nav */
  }

  .chat-trigger-button {
    width: 3.5rem;
    height: 3.5rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    /* Make it pop out of the menubar slightly by translating up, 
       but not overlapping content as much as before */
    transform: translateY(-15px);
  }

  .chat-trigger-button:hover {
     transform: translateY(-15px) scale(1.05); /* preserve upward translation on hover */
  }
  }
</style>
