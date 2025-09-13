<template>
    <!-- Резервируем корректное место под иконку -->
    <div class="game-icon" :style="wrapStyle" :title="titleText">
        <div v-if="!isLoading && !error && iconData" class="game-icon__image" :style="iconStyle" />
        <div v-else-if="isLoading" class="game-icon__placeholder game-icon__placeholder_loading" />
        <div v-else-if="error" class="game-icon__placeholder game-icon__placeholder_error" />
        <div v-else class="game-icon__placeholder game-icon__placeholder_not-found" />
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted } from 'vue'
    import { useIconsStore } from '@/stores/iconsStore'

    interface Props {
        id: string
        size?: number
        title?: string
    }
    const props = withDefaults(defineProps<Props>(), { size: 64 })

    const iconsStore = useIconsStore()
    const { loadIcons, getIconById, isLoading, error } = iconsStore

    onMounted(() => {
        loadIcons()
    })

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
        if (props.title) return props.title
        return iconData.value.id
    })
</script>

<style lang="scss" scoped>
    .game-icon {
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;

        &__image {
            border-radius: 4px;
            overflow: hidden;
            flex-shrink: 0;
        }

        &__placeholder {
            width: 64px;
            height: 64px;
            position: absolute;
            left: 0;
            top: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transform-origin: top left;
            transform: scale(var(--scale, 1));

            &_loading {
                background-color: #f0f0f0;
                border: 2px dashed #ccc;

                &::after {
                    content: "⏳";
                    font-size: 0.6em;
                }
            }

            &_error {
                background-color: #ffebee;
                border: 2px solid #f44336;

                &::after {
                    content: "❌";
                    font-size: 0.6em;
                }
            }

            &_not-found {
                background-color: #fff3e0;
                border: 2px solid #ff9800;

                &::after {
                    content: "❓";
                    font-size: 0.6em;
                }
            }
        }
    }
</style>