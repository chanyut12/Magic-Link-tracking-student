<template>
  <div :class="['dashboard-metric-card', `dashboard-metric-card--${tone}`, `dashboard-metric-card--${size}`]">
    <div class="dashboard-metric-card__top">
      <div class="dashboard-metric-card__copy">
        <div class="dashboard-metric-card__label">{{ label }}</div>
        <div v-if="subtitle" class="dashboard-metric-card__subtitle">{{ subtitle }}</div>
      </div>
      <div class="dashboard-metric-card__icon">
        <i :class="icon"></i>
      </div>
    </div>
    <div class="dashboard-metric-card__value">
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  label: string;
  value: number | string;
  subtitle?: string | undefined;
  icon: string;
  tone?: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'cyan';
  size?: 'compact' | 'hero';
}>(), {
  subtitle: '',
  tone: 'sky',
  size: 'compact',
});

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }

  return props.value;
});
</script>

<style scoped lang="scss">
.dashboard-metric-card {
  border-radius: 26px;
  padding: 20px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(15, 23, 42, 0.05);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

.dashboard-metric-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dashboard-metric-card__label {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.dashboard-metric-card__subtitle {
  margin-top: 6px;
  font-size: 0.82rem;
  color: #475569;
}

.dashboard-metric-card__icon {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  background: rgba(255, 255, 255, 0.55);
  color: #0f172a;
}

.dashboard-metric-card__value {
  margin-top: 22px;
  font-weight: 800;
  line-height: 0.92;
  color: #0f172a;
}

.dashboard-metric-card--compact .dashboard-metric-card__value {
  font-size: 2rem;
}

.dashboard-metric-card--hero .dashboard-metric-card__value {
  font-size: 3.4rem;
}

.dashboard-metric-card--emerald {
  background: #eef7f2;
}

.dashboard-metric-card--amber {
  background: #fdf5d8;
}

.dashboard-metric-card--rose {
  background: #fbe5e7;
}

.dashboard-metric-card--sky {
  background: #e8f2ff;
}

.dashboard-metric-card--slate {
  background: #eef2f7;
}

.dashboard-metric-card--cyan {
  background: #e7f8f6;
}

@media (max-width: 767px) {
  .dashboard-metric-card--hero .dashboard-metric-card__value {
    font-size: 2.7rem;
  }
}
</style>

