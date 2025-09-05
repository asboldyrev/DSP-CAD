<template>
    <!-- Резервируем корректное место под иконку -->
    <div class="game-icon-wrap" :style="wrapStyle" :title="titleText">
        <div v-if="!isLoading && !error && iconData" class="game-icon" :style="iconStyle" />
        <div v-else-if="isLoading" class="game-icon loading" />
        <div v-else-if="error" class="game-icon error" />
        <div v-else class="game-icon not-found" />
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, onMounted } from 'vue'
    import type { Icon } from '@/types/Icon'

    interface Props {
        id: string
        size?: number
    }
    const props = withDefaults(defineProps<Props>(), { size: 64 })

    const iconsData = ref<Icon[]>([])
    const isLoading = ref(true)
    const error = ref<string | null>(null)

    onMounted(async () => {
        try {
            const response = await fetch('/data/icons.json')
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            iconsData.value = await response.json()
            error.value = null
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to load icons data'
            console.error('Error loading icons:', err)
        } finally {
            isLoading.value = false
        }
    })

    const iconData = computed(() =>
        iconsData.value.find((icon: Icon) => icon.id === props.id)
    )

    // Внешняя обёртка — реальный размер для лэйаута
    const wrapStyle = computed(() => ({
        width: `${props.size}px`,
        height: `${props.size}px`,
        display: 'inline-block',
        position: 'relative',
        /* чтобы пиксели были чётче и у плейсхолдеров */
        imageRendering: 'pixelated' as const
    }))

    // Внутренний слой — всегда 64×64 и масштабируется трансформацией
    const iconStyle = computed(() => {
        if (!iconData.value || isLoading.value) return {}
        return {
            width: '64px',
            height: '64px',
            position: 'absolute',
            left: 0,
            top: 0,
            backgroundImage: 'url(/data/icons.webp)',
            backgroundPosition: iconData.value.position,
            backgroundColor: iconData.value.color,
            backgroundSize: 'auto',
            backgroundRepeat: 'no-repeat',
            display: 'inline-block',
            imageRendering: 'pixelated' as const,
            transform: `scale(${props.size / 64})`,
            transformOrigin: 'top left'
        }
    })

    // Текст заголовка для hover
    const titleText = computed(() => {
        if (isLoading.value) return 'Loading...'
        if (error.value) return `Error: ${error.value}`
        if (!iconData.value) return `Icon '${props.id}' not found`
        return iconData.value.id
    })
</script>

<style scoped>
    .game-icon-wrap {
        /* стили на всякий случай, можно убрать если не нужно */
    }

    .game-icon {
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
    }

    /* плейсхолдеры теперь внутри wrap, их не нужно вручную масштабировать */
    .game-icon.loading {
        width: 64px;
        height: 64px;
        position: absolute;
        left: 0;
        top: 0;
        background-color: #f0f0f0;
        border: 2px dashed #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        transform-origin: top left;
        transform: scale(var(--scale, 1));
    }

    .game-icon.loading::after {
        content: "⏳";
        font-size: 0.6em;
    }

    .game-icon.error {
        width: 64px;
        height: 64px;
        position: absolute;
        left: 0;
        top: 0;
        background-color: #ffebee;
        border: 2px solid #f44336;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .game-icon.error::after {
        content: "❌";
        font-size: 0.6em;
    }

    .game-icon.not-found {
        width: 64px;
        height: 64px;
        position: absolute;
        left: 0;
        top: 0;
        background-color: #fff3e0;
        border: 2px solid #ff9800;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .game-icon.not-found::after {
        content: "❓";
        font-size: 0.6em;
    }
</style>