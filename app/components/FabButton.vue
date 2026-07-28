<template>
    <div
        ref="wrapperEl"
        class="fixed bottom-20 right-4 z-20 transition-all duration-300 ease-out sm:hidden motion-reduce:transition-none"
        :class="hidden ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'"
    >
        <BaseButton icon="i-lucide-plus" size="lg" class="size-14 rounded-full shadow-lg" />
    </div>
</template>

<script setup lang="ts">
const wrapperEl = ref<HTMLElement | null>(null)
const hidden = ref(false)

let scrollEl: HTMLElement | Window | null = null
let lastScrollTop = 0

function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
    let node = el?.parentElement ?? null
    while (node) {
        const { overflowY } = getComputedStyle(node)
        if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node
        node = node.parentElement
    }
    return window
}

function getScrollTop() {
    return scrollEl instanceof Window ? window.scrollY : (scrollEl?.scrollTop ?? 0)
}

function onScroll() {
    const scrollTop = getScrollTop()
    const delta = scrollTop - lastScrollTop

    if (scrollTop <= 20) {
        hidden.value = false
    } else if (delta > 4) {
        hidden.value = true
    } else if (delta < -4) {
        hidden.value = false
    }

    lastScrollTop = scrollTop
}

onMounted(() => {
    scrollEl = findScrollParent(wrapperEl.value)
    lastScrollTop = getScrollTop()
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
    scrollEl?.removeEventListener('scroll', onScroll)
})
</script>
