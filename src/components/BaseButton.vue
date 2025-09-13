<template>
  <button
    @click="emit('click')"
    class="base-button"
    :class="{
      'base-button_active': active,
      'base-button_disabled': disabled,
      'base-button_remove': remove,
      'base-button_outline': outline,
      'base-button_block': block,
    }"
  >
    <i
      v-if="icon"
      class="base-button__icon"
      :class="{ [icon]: icon, 'base-button__icon_single': !slots.default }"
    ></i>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
  import { useSlots } from 'vue'

  const emit = defineEmits(['click'])
  defineProps<{
    icon?: string
    active?: boolean
    disabled?: boolean
    remove?: boolean
    outline?: boolean
    block?: boolean
  }>()
  const slots = useSlots()
</script>

<style lang="scss" scoped>
  .base-button {
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    $parent: &;

    &__icon {
      margin-right: 0.5rem;

      &_single {
        margin-right: 0;
      }
    }

    &:hover {
      background: #0056b3;
    }

    &_active {
      background: #28a745;

      &:hover {
        background: #218838;
      }
    }

    &_disabled {
      background: #6c757d;
      cursor: not-allowed;
      opacity: 0.6;

      &:hover {
        background: #6c757d;
      }
    }

    &_remove {
      background: #dc2626;
      color: white;

      &:hover {
        background: #b91c1c;
      }
    }

    &_outline {
      background: transparent;
      border: 1px solid #007bff;
      color: #007bff;

      &:hover {
        background: #0056b3;
        color: white;
      }

      &#{$parent}_active {
        color: #28a745;
        border-color: #28a745;

        &:hover {
          background: #218838;
          border-color: #218838;
          color: white;
        }
      }

      &#{$parent}_disabled {
        color: #6c757d;
        border-color: #6c757d;

        &:hover {
          background: #6c757d;
          border-color: #6c757d;
          color: white;
        }
      }

      &#{$parent}_remove {
        color: #dc2626;
        border-color: #dc2626;

        &:hover {
          background: #b91c1c;
          border-color: #b91c1c;
          color: white;
        }
      }
    }
  }
</style>
