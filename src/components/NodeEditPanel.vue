<template>
    <div v-if="isOpen" class="edit-panel">
        <div class="panel-header">
            <div class="header-content">
                <div class="header-icon">
                    <GameIcon v-if="selectedNode" :key="selectedNode.id" :id="selectedNode.item.id" :size="32" />
                </div>
                <h3>{{ selectedNode?.item.name }}</h3>
            </div>
            <button class="close-btn" @click="closePanel">×</button>
        </div>

        <div class="panel-content">

            <div class="panel-actions">
                <button class="delete-btn" @click="deleteNode">
                    Удалить ноду
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Node } from '@/types/Node'
    import GameIcon from './GameIcon.vue'

    interface Props {
        isOpen: boolean
        selectedNode: Node | null
    }

    interface Emits {
        (e: 'close'): void
        (e: 'delete', nodeId: number): void
    }

    const props = defineProps<Props>()
    const emit = defineEmits<Emits>()

    function closePanel() {
        emit('close')
    }

    function deleteNode() {
        if (props.selectedNode) {
            emit('delete', props.selectedNode.id)
            closePanel()
        }
    }
</script>

<style scoped>
    .edit-panel {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 350px;
        height: calc(100vh - 142px);
        /* Вычитаем высоту панели управления */
        background: white;
        border-left: 1px solid #e5e7eb;
        box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 100;
        display: flex;
        flex-direction: column;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: .5rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f8fafc;
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header-icon {
        flex-shrink: 0;
    }

    .panel-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .close-btn:hover {
        background-color: #f3f4f6;
        color: #374151;
    }

    .panel-content {
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
    }


    .panel-actions {
        margin-top: auto;
    }

    .delete-btn {
        width: 100%;
        padding: 0.75rem 1rem;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.2s;
    }

    .delete-btn:hover {
        background: #b91c1c;
    }
</style>