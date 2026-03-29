<template>
  <div class="stats-cards q-mb-lg">
    <div class="stat-card-mini total">
      <div class="stat-icon"><i class="fas fa-users"></i></div>
      <span class="label">นักเรียนทั้งหมด</span>
      <span class="value">{{ total }}</span>
    </div>
    <div class="stat-card-mini present">
      <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
      <span class="label">มา</span>
      <span class="value">{{ stats.present }}</span>
    </div>
    <div class="stat-card-mini absent">
      <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
      <span class="label">ขาด</span>
      <span class="value">{{ stats.absent }}</span>
    </div>
    <div class="stat-card-mini late">
      <div class="stat-icon"><i class="fas fa-clock"></i></div>
      <span class="label">สาย</span>
      <span class="value">{{ stats.late }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AttendanceHistoryStats } from '../../types/attendance';

defineProps<{
  total: number;
  stats: AttendanceHistoryStats;
}>();
</script>

<style lang="scss" scoped>
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card-mini {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &.present {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);

    .stat-icon {
      color: #22c55e;
    }

    .value {
      color: #15803d;
    }
  }

  &.absent {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);

    .stat-icon {
      color: #ef4444;
    }

    .value {
      color: #b91c1c;
    }
  }

  &.late {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);

    .stat-icon {
      color: #f59e0b;
    }

    .value {
      color: #b45309;
    }
  }

  .stat-icon {
    font-size: 1.75rem;
    opacity: 0.9;
  }

  .label {
    font-size: 0.7rem;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .value {
    font-size: 2.75rem;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1;
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card-mini {
    padding: 1.25rem;

    .stat-icon {
      font-size: 1.5rem;
    }

    .value {
      font-size: 2rem;
    }
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card-mini {
    padding: 1rem;

    .stat-icon {
      font-size: 1.25rem;
    }

    .value {
      font-size: 1.75rem;
    }

    .label {
      font-size: 0.65rem;
    }
  }
}
</style>
