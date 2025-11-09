<template>
    <button @click="toggleConnectionMode" class="control-btn" :class="{ 'active': isCreatingConnection, 'disabled': !hasAddConnection }" :disabled="!hasAddConnection">
        {{ isCreatingConnection ? 'Отменить связь' : 'Добавить связь' }}
    </button>
</template>

<script setup lang="ts">
    import { useNodesStore } from '@/stores/nodesStore';
    import { computed, ref } from 'vue';

    const isCreatingConnection = ref(false)

    const nodesStore = useNodesStore()

    function toggleConnectionMode() {
        return false
    }

    const hasAddConnection = computed(() => {
        const res = nodesStore.allNodes.length >= 2
        console.log(res)
        return res
    })
</script>

<style scoped>
    .control-btn {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }

    .control-btn:hover {
        background: #0056b3;
    }

    .control-btn.active {
        background: #28a745;
    }

    .control-btn.active:hover {
        background: #218838;
    }

    .control-btn.disabled {
        background: #6c757d;
        cursor: not-allowed;
        opacity: 0.6;
    }

    .control-btn.disabled:hover {
        background: #6c757d;
    }
</style>
