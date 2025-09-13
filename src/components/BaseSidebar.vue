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
    withDefaults(
        defineProps<{headerTargetId?: string }>(),
        {headerTargetId: 'sidebar-header-target'}
    )
</script>

<style lang="scss" scoped>
.sidebar {
    width: 360px;
    border-left: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;

    &-header {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
    }

    &-body {
        padding: 12px 16px;
        overflow: auto;
        flex: 1;
    }
}
</style>
