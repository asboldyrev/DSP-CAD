<template>
    <teleport :to="`#${headerTargetId}`">
        <div class="header-content">
            <div class="header-icon">
                <i class="ri-building-line"></i>
            </div>
            <h3>Новое строение</h3>
        </div>
    </teleport>

    <div>
        <div class="buildings-container">
            <div v-for="(buildings, row) in itemsStore.getProducerBuildingsGroupedByRow().value" :key="row" class="buildings-row">
                <div class="buildings-grid">
                    <div v-for="building in buildings" :key="building.id" class="building-tile" :title="building.name" @click="selectBuilding(building)">
                        <div class="building-icon">
                            <GameIcon :id="building.id" :title="building.name" :size="48" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="connection-btn">
        <CreatingConnection />
    </div>
</template>

<script setup lang="ts">
    import type { Item } from '@/data-source/dto/item.dto';
    import CreatingConnection from '@/components/CreatingConnection.vue';
    import { useItemsStore } from '@/stores/itemsStore';
    import { useNodesStore } from '@/stores/nodesStore';

    const props = withDefaults(defineProps<{ headerTargetId?: string }>(), {
        headerTargetId: 'sidebar-header-target',
    })

    const itemsStore = useItemsStore()
    const nodeStore = useNodesStore()

    function selectBuilding(building: Item) {
        nodeStore.addNode(building)
    }
</script>

<style scoped>
    .buildings-container {
        display: flex;
        flex-direction: column;
        gap: .3rem;
    }

    .buildings-row {
        display: flex;
        flex-direction: column;
    }

    .buildings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
        gap: .3rem;
    }

    .building-tile {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
        width: 48px;
        height: 48px;
    }

    .building-tile:hover {
        border-color: #3b82f6;
        background-color: #f8fafc;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }

    .building-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .connection-btn {
        margin-top: 24px;
    }

    /* .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 800px;
        max-height: 80vh;
        width: 90%;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
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

    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .error {
        color: #dc2626;
    }

    .buildings-container {
        display: flex;
        flex-direction: column;
        gap: .3rem;
    }

    .buildings-row {
        display: flex;
        flex-direction: column;
    }

    .buildings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
        gap: .3rem;
    }

    .building-tile {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
        width: 48px;
        height: 48px;
    }

    .building-tile:hover {
        border-color: #3b82f6;
        background-color: #f8fafc;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }

    .building-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    } */
</style>
