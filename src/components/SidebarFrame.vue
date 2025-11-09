<template>
    <aside class="sidebar">
        <!-- Сюда телепортируются заголовки из дочерних панелей -->
        <header :id="headerTargetId" class="sidebar-header" />
        <section class="sidebar-body">
            <slot />
        </section>
    </aside>
</template>

<script setup lang="ts">
    // По умолчанию один сайдбар на странице
    const props = withDefaults(defineProps<{ headerTargetId?: string }>(), {
        headerTargetId: 'sidebar-header-target',
    })
</script>

<style scoped>
    .sidebar {
        height: 100%;
        border-left: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
    }

    .sidebar-body {
        height: calc(100vh - 50px);
        padding: 12px 8px;
        overflow: hidden;
        overflow-y: auto;
        flex: 1;
    }
</style>
