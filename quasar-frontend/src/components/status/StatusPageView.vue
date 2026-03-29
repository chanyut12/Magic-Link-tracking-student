<template>
  <section :class="['status-page-view', `status-page-view--${tone}`]">
    <div class="status-page-view__backdrop"></div>

    <div class="status-page-view__shell">
      <div class="status-page-view__panel">
        <div v-if="code" class="status-page-view__code">{{ code }}</div>

        <div class="status-page-view__card">
          <div class="status-page-view__icon-wrap">
            <q-icon :name="icon" class="status-page-view__icon" />
          </div>

          <div class="status-page-view__copy">
            <h1 class="status-page-view__title">{{ title }}</h1>
            <p class="status-page-view__message">{{ message }}</p>
            <p v-if="note" class="status-page-view__note">{{ note }}</p>
          </div>

          <div v-if="$slots.meta" class="status-page-view__meta">
            <slot name="meta"></slot>
          </div>

          <div v-if="hasActions" class="status-page-view__actions">
            <q-btn
              v-if="primaryLabel"
              unelevated
              no-caps
              :label="primaryLabel"
              :to="primaryTo"
              class="status-page-view__action status-page-view__action--primary"
              color="primary"
            />
            <q-btn
              v-if="secondaryLabel"
              flat
              no-caps
              :label="secondaryLabel"
              :to="secondaryTo"
              class="status-page-view__action status-page-view__action--secondary"
              color="grey-8"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

const props = withDefaults(defineProps<{
  code?: string | undefined;
  icon: string;
  title: string;
  message: string;
  note?: string | undefined;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  primaryLabel?: string | undefined;
  primaryTo?: RouteLocationRaw | string | undefined;
  secondaryLabel?: string | undefined;
  secondaryTo?: RouteLocationRaw | string | undefined;
}>(), {
  code: '',
  note: '',
  tone: 'info',
  primaryLabel: '',
  primaryTo: undefined,
  secondaryLabel: '',
  secondaryTo: undefined,
});

const hasActions = computed(() => Boolean(props.primaryLabel || props.secondaryLabel));
</script>

<style scoped lang="scss">
.status-page-view {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.status-page-view__backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.8), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.94));
}

.status-page-view__shell {
  position: relative;
  z-index: 1;
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: clamp(28px, 5vw, 56px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-page-view__panel {
  width: min(100%, 760px);
  position: relative;
}

.status-page-view__code {
  position: absolute;
  top: clamp(-20px, -1vw, -8px);
  right: clamp(12px, 4vw, 28px);
  font-size: clamp(4.4rem, 15vw, 8.5rem);
  line-height: 0.9;
  font-weight: 900;
  letter-spacing: -0.08em;
  color: rgba(15, 23, 42, 0.07);
  user-select: none;
  pointer-events: none;
}

.status-page-view__card {
  position: relative;
  border-radius: 30px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
  padding: clamp(28px, 5vw, 42px);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  animation: status-enter 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.status-page-view__icon-wrap {
  width: 78px;
  height: 78px;
  border-radius: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.status-page-view__icon {
  font-size: 2rem;
}

.status-page-view__copy {
  max-width: 560px;
}

.status-page-view__title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 2.8rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: #0f172a;
}

.status-page-view__message {
  margin: 16px 0 0;
  font-size: 1.06rem;
  line-height: 1.8;
  color: #334155;
}

.status-page-view__note {
  margin: 12px 0 0;
  font-size: 0.96rem;
  line-height: 1.7;
  color: #475569;
}

.status-page-view__meta {
  margin-top: 22px;
}

.status-page-view__actions {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.status-page-view__action {
  min-height: 46px;
  padding-inline: 20px;
  border-radius: 16px;
}

.status-page-view--success {
  background: linear-gradient(180deg, #eef8f2 0%, #f6fbf8 100%);
}

.status-page-view--success .status-page-view__icon-wrap {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
}

.status-page-view--warning {
  background: linear-gradient(180deg, #fff8e6 0%, #fffdf8 100%);
}

.status-page-view--warning .status-page-view__icon-wrap {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.status-page-view--danger {
  background: linear-gradient(180deg, #fff1f2 0%, #fff8f9 100%);
}

.status-page-view--danger .status-page-view__icon-wrap {
  background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%);
  color: #be123c;
}

.status-page-view--info {
  background: linear-gradient(180deg, #eef6ff 0%, #f8fbff 100%);
}

.status-page-view--info .status-page-view__icon-wrap {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
}

.status-page-view--neutral {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.status-page-view--neutral .status-page-view__icon-wrap {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
}

@keyframes status-enter {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 767px) {
  .status-page-view__card {
    border-radius: 24px;
  }

  .status-page-view__code {
    right: 10px;
  }

  .status-page-view__icon-wrap {
    width: 68px;
    height: 68px;
    border-radius: 20px;
    margin-bottom: 18px;
  }

  .status-page-view__actions {
    flex-direction: column;
  }

  .status-page-view__action {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-page-view__card {
    animation: none;
  }
}
</style>
