<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click="handleBackdropClick"
    >
      <div
        class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full transform transition-all duration-300"
        :class="[
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          typeClasses
        ]"
        @click.stop
      >
        <!-- Icon -->
        <div class="flex justify-center mb-4">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center"
            :class="iconBgClass"
          >
            <component :is="iconComponent" class="w-8 h-8" :class="iconClass" />
          </div>
        </div>

        <!-- Content -->
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>
          <p class="text-gray-600 mb-6">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            v-if="showCancel"
            @click="handleCancel"
            class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
          >
            {{ cancelText }}
          </button>
          <button
            @click="handleConfirm"
            class="flex-1 px-4 py-2 text-white rounded-xl transition-colors duration-200"
            :class="confirmButtonClass"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'

interface Props {
  show: boolean
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  persistent?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: false,
  persistent: false
})

const emit = defineEmits<Emits>()

const iconComponent = computed(() => {
  const icons = {
    success: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M5 13l4 4L19 7'
      })
    ]),
    error: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M6 18L18 6M6 6l12 12'
      })
    ]),
    warning: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.793-1.381 2.465-2.896L18.893 5.382c-.297-1.378-1.54-2.382-2.995-2.382H8.102c-1.454 0-2.698 1.004-2.995 2.382L2.607 16.104C2.279 17.619 3.522 19 5.062 19z'
      })
    ]),
    info: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ]),
    confirm: () => h('svg', {
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      })
    ])
  }

  return icons[props.type] || icons.info
})

const typeClasses = computed(() => {
  const classes = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500',
    warning: 'border-l-4 border-yellow-500',
    info: 'border-l-4 border-blue-500',
    confirm: 'border-l-4 border-purple-500'
  }
  return classes[props.type] || classes.info
})

const iconBgClass = computed(() => {
  const classes = {
    success: 'bg-green-100',
    error: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100',
    confirm: 'bg-purple-100'
  }
  return classes[props.type] || classes.info
})

const iconClass = computed(() => {
  const classes = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    confirm: 'text-purple-600'
  }
  return classes[props.type] || classes.info
})

const confirmButtonClass = computed(() => {
  const classes = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
    confirm: 'bg-purple-600 hover:bg-purple-700'
  }
  return classes[props.type] || classes.info
})

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleBackdropClick = () => {
  if (!props.persistent) {
    emit('close')
  }
}
</script>
