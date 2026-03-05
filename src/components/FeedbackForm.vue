<template>
  <div class="fixed inset-0 z-[1050] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-[var(--color-bg-card)] dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-[800px] flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700">
      <header class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0 bg-[var(--color-bg-body)] dark:bg-slate-800/50">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[24px] text-slate-900 dark:text-slate-100">feedback</span>
          <h2 class="text-lg font-bold leading-tight m-0 text-slate-900 dark:text-slate-100">
            {{ feedback.id ? 'Feedback #' + feedback.id : 'Novo Feedback' }}
          </h2>
        </div>
        <button class="flex cursor-pointer items-center justify-center rounded-lg w-8 h-8 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors" @click="$emit('close')">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </header>

      <div class="flex flex-col flex-1 overflow-hidden">
        <form @submit.prevent="save" class="flex flex-col h-full">
          <div class="overflow-y-auto p-6 flex-1 bg-transparent dark:bg-slate-900/50">
            <div class="flex flex-col gap-6">
              <label class="flex flex-col">
                <p class="text-slate-900 dark:text-slate-100 text-sm font-medium pb-2">Título</p>
                <input v-model="form.title" :disabled="!!feedback.id" class="form-input flex w-full rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11 px-4 text-base transition-colors disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800" type="text" required/>
              </label>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label class="flex flex-col">
                  <p class="text-slate-900 dark:text-slate-100 text-sm font-medium pb-2">Tipo</p>
                  <select v-model="form.feedbackType" :disabled="!!feedback.id" class="form-select flex w-full rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11 px-4 text-base transition-colors disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800" required>
                    <option v-for="type in feedbackTypes" :key="type.name" :value="type.name">
                      {{ type.description }}
                    </option>
                  </select>
                </label>

                <label class="flex flex-col">
                  <p class="text-slate-900 dark:text-slate-100 text-sm font-medium pb-2">Relator (Profissional)</p>
                  <div class="h-11">
                    <BaseLookup
                        v-model="form.reporterId"
                        :disabled="!!feedback.id"
                        :initial-description="form.reporter?.name"
                        :search-service="professionalService"
                        placeholder="Selecione o Relator"
                    />
                  </div>
                </label>

                <label v-if="feedback.id" class="flex flex-col">
                  <p class="text-slate-900 dark:text-slate-100 text-sm font-medium pb-2">Status</p>
                  <select v-model="form.feedbackStatus" class="form-select flex w-full rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11 px-4 text-base transition-colors">
                    <option v-for="status in feedbackStatuses" :key="status.name" :value="status.name">
                      {{ status.description }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="flex flex-col gap-2">
                <p class="text-slate-900 dark:text-slate-100 text-sm font-medium">Descrição</p>
                <div v-if="isMarkdown && feedback.id" class="markdown-content bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4 max-h-[300px] overflow-y-auto text-sm" v-html="renderedDescription"></div>
                <textarea v-else v-model="form.description" :disabled="!!feedback.id" class="form-input flex w-full rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 p-4 text-base transition-colors disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800" required
                          rows="4"></textarea>
              </div>

              <!-- Chat Section -->
              <div v-if="feedback.id" class="mt-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h4 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Comentários e Respostas</h4>
                <div ref="chatContainer" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-[240px] overflow-y-auto p-4 mb-4 flex flex-col gap-4">
                  <div v-if="localReplies.length === 0" class="text-center text-slate-500 dark:text-slate-400 italic my-auto">
                    Nenhum comentário ainda.
                  </div>
                  <div
                      v-for="reply in localReplies"
                      :key="reply.id"
                      :class="['max-w-[85%] p-3 md:p-4 rounded-xl shadow-sm border', isOwnMessage(reply) ? 'self-end bg-indigo-50 border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800/50 rounded-tr-sm' : 'self-start bg-slate-50 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600 rounded-tl-sm']"
                  >
                    <div class="flex justify-between items-center gap-4 mb-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span class="font-bold text-slate-700 dark:text-slate-300">{{ reply.author?.name }}</span>
                      <span class="text-[11px]">{{ formatDateTime(reply.createdAt) }}</span>
                    </div>
                    <div class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {{ reply.message }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-3">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Responder como:</label>
                    <div class="h-10 w-full max-w-[400px]">
                      <BaseLookup
                          v-model="replyAuthorId"
                          :search-service="professionalService"
                          placeholder="Selecione o Profissional"
                      />
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <textarea
                        v-model="newReply"
                        class="form-input flex w-full rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 p-3 text-sm transition-colors"
                        placeholder="Escreva uma resposta... (Ctrl+Enter para enviar)"
                        rows="2"
                        @keydown.ctrl.enter="sendReply"
                    ></textarea>
                    <button :disabled="!newReply.trim() || !replyAuthorId || sendingReply" class="self-end px-5 py-2.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shrink-0" type="button"
                            @click="sendReply">
                      <span v-if="!sendingReply">Enviar</span>
                      <span v-else>...</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer class="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-[var(--color-bg-body)] dark:bg-slate-800 flex-shrink-0">
            <button class="px-5 py-2.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-500" type="button" @click="$emit('close')">Fechar</button>
            <button v-if="canSave" class="px-5 py-2.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800" type="submit">Salvar Alterações</button>
          </footer>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, defineProps, defineEmits, onMounted, computed, nextTick, watch} from 'vue';
import {feedbackService} from '../services/feedbackService';
import {authService} from '../services/authService';
import {enumService} from '../services/enumService';
import {useModal} from '../composables/useModal';
import {useEscapeKey} from '../composables/useEscapeKey';
import {formatDateTime} from '../utils/formatters';

import BaseLookup from './common/BaseLookup.vue';
import {professionalService} from '../services/professionalService';
import {clientService} from '../services/clientService';
import {marked} from 'marked';

const props = defineProps({
  feedback: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['close', 'save']);
useModal(emit);
useEscapeKey(() => emit('close'));

const form = ref({
  title: '',
  description: '',
  feedbackType: 'BUG',
  feedbackStatus: 'NEW',
  userId: null,
  user: null,
  reporterId: null,
  reporter: null
});

const localReplies = ref([]);
const newReply = ref('');
const replyAuthorId = ref(null);
const sendingReply = ref(false);
const chatContainer = ref(null);
const currentUser = ref({});

const feedbackStatuses = ref([]);
const feedbackTypes = ref([]);

const isMarkdown = computed(() => {
  return form.value.descriptionFormat === 'MARKDOWN';
});

const renderedDescription = computed(() => {
  if (isMarkdown.value && form.value.description) {
    return marked(form.value.description);
  }
  return form.value.description || '';
});

onMounted(async () => {
  currentUser.value = authService.getCurrentUser();
  feedbackStatuses.value = await enumService.getOptions('FeedbackStatus');
  feedbackTypes.value = await enumService.getOptions('FeedbackType');
  if (props.feedback.id) {
    form.value = {
      ...props.feedback,
      descriptionFormat: props.feedback.descriptionFormat || null,
      userId: props.feedback.user?.id,
      user: props.feedback.user,
      reporterId: props.feedback.reporter?.id,
      reporter: props.feedback.reporter
    };
    localReplies.value = props.feedback.replies || [];
    scrollToBottom();
  }
});

const canSave = computed(() => {
  // If it's new, we can save.
  if (!props.feedback.id) return true;
  // If existing, we can save if status changed (implied checks could be stricter)
  // Here we just allow saving the status.
  return true;
});

const isOwnMessage = (reply) => {
  // Cannot determine 'own' easily if decoupled.
  // Maybe we can highlight if reply.author.id == replyAuthorId?
  // For now, let's rely on name display or remove 'own' styling if not applicable.
  // Or we stick to User email check if the Professional happens to be linked?
  // User said "User has nothing to do with Professional".
  // So we shouldn't rely on auth email.
  // Let's remove 'own' styling or just check if it matches the currently selected professional?
  if (replyAuthorId.value && reply.author?.id === replyAuthorId.value) {
    return true;
  }
  return false;
};

const sendReply = async () => {
  if (!newReply.value.trim() || !replyAuthorId.value) {
    if (!replyAuthorId.value) alert('Selecione o profissional que está respondendo.');
    return;
  }

  sendingReply.value = true;
  try {
    const response = await feedbackService.addReply(props.feedback.id, {
      message: newReply.value,
      authorId: replyAuthorId.value
    });
    // The endpoint returns the created reply
    localReplies.value.push(response.data);
    newReply.value = '';
    scrollToBottom();
  } catch (error) {
    console.error('Failed to send reply', error);
    alert('Erro ao enviar resposta.');
  } finally {
    sendingReply.value = false;
  }
};

const save = () => {
  // We only emit save for the main form fields (status update mostly for existing ones)
  emit('save', form.value);
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};
</script>

<style scoped>
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 0.8em;
  margin-bottom: 0.4em;
  font-weight: 600;
  color: var(--color-text);
}
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.5em;
  list-style: inherit;
}
.markdown-content :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.85em;
}
.dark .markdown-content :deep(code) {
  background: rgba(255, 255, 255, 0.1);
}
.markdown-content :deep(p) {
  margin: 0.5em 0;
}
</style>
