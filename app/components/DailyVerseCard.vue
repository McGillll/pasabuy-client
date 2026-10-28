<template>
    <UCard v-if="loading" :ui="{ body: 'space-y-3' }">
        <USkeleton class="h-4 w-1/3" />
        <USkeleton class="h-5 w-full" />
        <USkeleton class="h-5 w-2/3" />
    </UCard>

    <UCard v-else-if="verse.text">
        <div class="mb-3 flex items-center gap-3">
            <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UIcon name="i-lucide-book-open" class="size-4" />
            </div>
            <p class="text-xs font-medium uppercase tracking-wide text-dimmed">Verse of the day</p>
        </div>
        <p class="font-medium leading-relaxed text-highlighted">{{ verse.text }}</p>
        <p class="mt-3 text-sm text-muted">{{ verse.reference }}</p>
    </UCard>
</template>

<script setup lang="ts">
import { dailyVerseService } from '@/components/api/DailyVerseService'

const loading = ref(true)
const verse = reactive<{ reference: string | null, text: string | null }>({ reference: null, text: null })

async function loadVerse() {
    loading.value = true
    try {
        const response = await dailyVerseService.fetchToday()
        verse.reference = response.data.reference
        verse.text = response.data.text
    } catch {
        verse.reference = null
        verse.text = null
    } finally {
        loading.value = false
    }
}

onMounted(loadVerse)
</script>
