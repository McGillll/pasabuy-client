<template>
    <ClientOnly>
        <Teleport to="body">
            <div
                class="pointer-events-none fixed inset-x-0 top-0 z-100 flex justify-center transition-transform"
                :class="{ 'duration-200 ease-out': !tracking }"
                :style="{ transform: `translateY(${offset}px)` }"
            >
                <div class="mt-2 flex size-9 items-center justify-center rounded-full bg-default shadow-lg ring ring-default">
                    <UIcon
                        :name="refreshing ? 'i-lucide-loader-circle' : 'i-lucide-arrow-down'"
                        class="size-5 text-primary"
                        :class="[refreshing ? 'animate-spin' : 'transition-transform', !refreshing && pullDistance > THRESHOLD ? 'rotate-180' : '']"
                    />
                </div>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script setup lang="ts">
const THRESHOLD = 70
const MAX_PULL = 90
const INDICATOR_HIDDEN = -56
const INDICATOR_VISIBLE = 8

const handler = usePullToRefreshHandler()

const tracking = ref(false)
const pullDistance = ref(0)
const refreshing = ref(false)

let startX = 0
let startY = 0
let axisLocked: 'x' | 'y' | null = null
let scrollParent: HTMLElement | Window | null = null

const offset = computed(() => {
    if (refreshing.value) return INDICATOR_VISIBLE
    const progress = Math.min(pullDistance.value, MAX_PULL) / MAX_PULL
    return INDICATOR_HIDDEN + (INDICATOR_VISIBLE - INDICATOR_HIDDEN) * progress
})

function getScrollParent(node: EventTarget | null): HTMLElement | Window {
    let el = node instanceof HTMLElement ? node : null
    while (el && el !== document.body) {
        const style = window.getComputedStyle(el)
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
            return el
        }
        el = el.parentElement
    }
    return window
}

function scrollTopOf(target: HTMLElement | Window) {
    return target instanceof Window ? window.scrollY : target.scrollTop
}

function onTouchStart(event: TouchEvent) {
    if (!handler.value || refreshing.value || event.touches.length !== 1) return

    const parent = getScrollParent(event.target)
    if (scrollTopOf(parent) > 0) return

    scrollParent = parent
    startX = event.touches[0]!.clientX
    startY = event.touches[0]!.clientY
    axisLocked = null
    tracking.value = true
}

function onTouchMove(event: TouchEvent) {
    if (!tracking.value || !scrollParent) return

    const touch = event.touches[0]!
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    if (!axisLocked) {
        if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return
        axisLocked = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
    }

    if (axisLocked === 'x') {
        tracking.value = false
        pullDistance.value = 0
        return
    }

    if (deltaY <= 0 || scrollTopOf(scrollParent) > 0) {
        pullDistance.value = 0
        return
    }

    event.preventDefault()
    pullDistance.value = deltaY * 0.5
}

async function onTouchEnd() {
    if (!tracking.value) return
    tracking.value = false
    scrollParent = null

    if (pullDistance.value > THRESHOLD && handler.value) {
        refreshing.value = true
        try {
            await handler.value()
        } finally {
            refreshing.value = false
            pullDistance.value = 0
        }
    } else {
        pullDistance.value = 0
    }
}

onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
})

onUnmounted(() => {
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
})
</script>
