<template>
    <!-- Резервируем корректное место под иконку -->
    <div class="game-icon-wrap" :style="wrapStyle" :title="titleText">
        <div v-if="!isLoading && !error && iconData" class="game-icon" :style="iconStyle" />
        <div v-else-if="isLoading" class="game-icon loading">
            <i class="ri-loader-line spin"></i>
        </div>
        <div v-else-if="error" class="game-icon error">
            <i class="ri-error-warning-line"></i>
        </div>
        <div v-else class="game-icon not-found">
            <i class="ri-close-large-line"></i>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useIconsStore } from '@/stores/iconsStore'

    interface Props {
        id: string
        size?: number
        title?: string
    }
    const props = withDefaults(defineProps<Props>(), { size: 64 })

    const iconsStore = useIconsStore()
    const { getIconById, isLoading, error } = iconsStore

    const iconData = getIconById(props.id)

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
        if (!iconData || isLoading) return {}
        return {
            width: '64px',
            height: '64px',
            position: 'absolute',
            left: 0,
            top: 0,
            backgroundImage: 'url(/data/icons.webp)',
            backgroundPosition: iconData.value?.position,
            backgroundColor: iconData.value?.color,
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
        if (isLoading) return 'Loading...'
        if (error) return `Error: ${error}`
        if (!iconData) return `Icon '${props.id}' not found`
        if (props.title) return props.title
        return iconData.value?.id
    })
</script>

<style lang="scss" scoped>
    .game-icon-wrap {
        /* стили на всякий случай, можно убрать если не нужно */
    }

    .game-icon {
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;

        // i {
        //     font-size: 2rem;
        // }

        .spin {
            animation: spin 2s linear infinite;
        }

        &.loading {
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

        &.error {
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

        &.not-found {
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
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>
