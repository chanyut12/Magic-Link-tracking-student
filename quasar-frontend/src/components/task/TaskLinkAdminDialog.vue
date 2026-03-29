<template>
  <q-dialog v-model="dialogModel">
    <q-card style="min-width: 360px; max-width: 92vw;">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
        <div class="text-caption text-grey-7 q-mt-xs">{{ hint }}</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="reasonModel"
          :label="reasonLabel"
          outlined
          dense
          autogrow
          type="textarea"
          :rules="[val => !!val || 'กรุณาระบุเหตุผล']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="ยกเลิก" v-close-popup />
        <q-btn
          :color="action === 'lock' ? 'negative' : 'primary'"
          :label="confirmLabel"
          :loading="loading"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskLinkAdminAction } from '../../types/task';

const props = defineProps<{
  modelValue: boolean;
  reason: string;
  title: string;
  hint: string;
  reasonLabel: string;
  confirmLabel: string;
  action: TaskLinkAdminAction;
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'update:reason', value: string): void;
  (event: 'confirm'): void;
}>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const reasonModel = computed({
  get: () => props.reason,
  set: (value: string) => emit('update:reason', value),
});
</script>
