<template>
    <BaseModal
        v-model:open="workspace.isPosterModalOpen"
        title="Schedule poster"
        size="xl"
        view-only
        :ui="{ body: 'overflow-y-auto' }"
    >
        <div class="space-y-4">
            <div ref="previewViewport" class="overflow-hidden rounded-lg" :style="{ height: `${previewHeight}px` }">
                <div class="mx-auto overflow-hidden" :style="posterPreviewFrameStyle">
                    <div :style="posterPreviewScaleStyle">
                        <div
                            ref="posterEl"
                            class="relative h-[1350px] w-[1080px] overflow-hidden bg-slate-950 text-white [font-family:Aptos,'Segoe_UI_Variable_Text','Segoe_UI',ui-sans-serif,system-ui,sans-serif]"
                        >
                            <div class="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#0f172a_46%,#111827_100%)]" />
                            <div class="absolute right-0 top-0 h-full w-[320px] skew-x-[-14deg] bg-primary/12" />
                            <div class="absolute bottom-0 left-0 h-[260px] w-full skew-y-[-8deg] bg-slate-800/70" />
                            <div class="absolute left-[72px] top-[42px] h-[12px] w-[210px] rounded-full bg-primary" />

                            <div class="absolute left-[72px] top-[92px] z-10 min-w-0">
                                <p class="text-[32px] font-semibold uppercase leading-none tracking-wide text-primary">Pasabuy schedule</p>
                                <p class="mt-[20px] max-w-[620px] text-[50px] font-bold leading-tight text-white">{{ businessName }}</p>
                            </div>

                            <div class="absolute left-[72px] top-[330px] z-10 space-y-[34px]">
                                <h2 class="line-clamp-4 max-w-[880px] text-[96px] font-black leading-[0.98] text-white">{{ schedule.title }}</h2>
                                <p class="flex items-center gap-[20px] text-[42px] font-semibold text-slate-200">
                                    <span class="flex size-[70px] items-center justify-center rounded-[24px] bg-white/10 text-primary">
                                        <UIcon name="i-lucide-calendar-clock" class="size-[38px]" />
                                    </span>
                                    {{ scheduleDateLabel }}
                                </p>
                            </div>

                            <p class="absolute left-[72px] top-[575px] z-10 line-clamp-5 max-w-[840px] text-[40px] font-normal leading-snug text-slate-300">
                                {{ notesLabel }}
                            </p>

                            <div class="absolute bottom-[190px] left-[72px] z-10 w-[560px]">
                                <div class="flex items-center gap-[22px] text-primary">
                                    <UIcon name="i-lucide-qr-code" class="size-[62px] shrink-0" />
                                    <p class="text-[52px] font-black leading-[1.05] text-white [font-family:Bahnschrift,'Aptos_Display','Segoe_UI_Variable_Display','Arial_Narrow',sans-serif]">Scan to order</p>
                                </div>
                                <p class="mt-[22px] max-w-[480px] text-[28px] leading-tight text-slate-400">
                                    Prices are estimates until confirmed after shopping
                                </p>
                            </div>

                            <div class="absolute bottom-[190px] right-[60px] z-10 rounded-[36px] bg-white p-[24px] shadow-2xl shadow-black/40">
                                <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="" class="size-[272px]" />
                                <div v-else class="flex size-[272px] items-center justify-center bg-slate-100 text-slate-500">
                                    <UIcon name="i-lucide-loader-circle" class="size-[54px] animate-spin" />
                                </div>
                            </div>

                            <p class="absolute bottom-[72px] left-[72px] z-10 max-w-[936px] truncate text-[28px] text-slate-500">{{ workspace.publicLink }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid gap-2 sm:grid-cols-3">
                <BaseButton v-if="canShare" icon="i-lucide-share-2" block :loading="sharing" @click="sharePoster">
                    Share
                </BaseButton>
                <BaseButton icon="i-lucide-download" :variant="canShare ? 'soft' : 'solid'" :color="canShare ? 'neutral' : 'primary'" block :loading="downloading" @click="downloadPoster">
                    Download PNG
                </BaseButton>
                <BaseButton icon="i-lucide-copy" color="neutral" variant="soft" block @click="workspace.copyLink">
                    Copy link
                </BaseButton>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'

const props = defineProps<{
    workspace: ScheduleWorkspace
}>()

const toast = useToast()
const posterEl = ref<HTMLElement | null>(null)
const previewViewport = ref<HTMLElement | null>(null)
const qrCodeDataUrl = ref('')
const previewScale = ref(0.28)
const canShare = ref(false)
const sharing = ref(false)
const downloading = ref(false)

const POSTER_WIDTH = 1080
const POSTER_HEIGHT = 1350

const schedule = computed(() => props.workspace.schedule!)
const businessName = computed(() => props.workspace.posterBusinessName || 'Pasabuy')

const scheduleDateLabel = computed(() => {
    if (!schedule.value.pasabuy_schedule_date) return 'Date to be announced'
    return `Order cutoff: ${formatDate(schedule.value.pasabuy_schedule_date)}`
})

const notesLabel = computed(() => schedule.value.description?.trim() || 'Fresh pasabuy batch now accepting orders.')
const previewHeight = computed(() => POSTER_HEIGHT * previewScale.value)
const posterPreviewFrameStyle = computed(() => ({
    width: `${POSTER_WIDTH * previewScale.value}px`,
    height: `${POSTER_HEIGHT * previewScale.value}px`
}))
const posterPreviewScaleStyle = computed(() => ({
    transform: `scale(${previewScale.value})`,
    transformOrigin: 'top left'
}))

watch(() => props.workspace.publicLink, generateQrCode, { immediate: true })
watch(() => props.workspace.isPosterModalOpen, async (open) => {
    if (!open) return
    await nextTick()
    requestAnimationFrame(() => updatePreviewScale())
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
    canShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    resizeObserver = new ResizeObserver(updatePreviewScale)
    if (previewViewport.value) resizeObserver.observe(previewViewport.value)
    updatePreviewScale()
})

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
})

async function generateQrCode() {
    if (!props.workspace.publicLink) {
        qrCodeDataUrl.value = ''
        return
    }

    qrCodeDataUrl.value = await QRCode.toDataURL(props.workspace.publicLink, {
        width: 272,
        margin: 1,
        color: {
            dark: '#020617',
            light: '#ffffff'
        }
    })
}

function updatePreviewScale() {
    if (!previewViewport.value) return
    const availableWidth = Math.max(previewViewport.value.clientWidth - 16, 280)
    previewScale.value = Math.min(1, availableWidth / POSTER_WIDTH)
}

async function createPosterBlob() {
    if (!posterEl.value) throw new Error('Poster is not ready yet.')
    await nextTick()
    await document.fonts?.ready
    const dataUrl = await toPng(posterEl.value, {
        cacheBust: true,
        skipFonts: true,
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        canvasWidth: POSTER_WIDTH,
        canvasHeight: POSTER_HEIGHT,
        pixelRatio: 1,
        backgroundColor: '#020617',
        style: {
            transform: 'none',
            transformOrigin: 'top left',
            width: `${POSTER_WIDTH}px`,
            height: `${POSTER_HEIGHT}px`
        }
    })
    const response = await fetch(dataUrl)
    return await response.blob()
}

function posterFileName() {
    const baseName = schedule.value.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'pasabuy-schedule'
    return `${baseName}-poster.png`
}

async function downloadPoster() {
    downloading.value = true
    try {
        const blob = await createPosterBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = posterFileName()
        link.click()
        URL.revokeObjectURL(url)
        toast.add({ title: 'Poster downloaded', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Download failed', description: (error as Error).message, color: 'error' })
    } finally {
        downloading.value = false
    }
}

async function sharePoster() {
    sharing.value = true
    try {
        const blob = await createPosterBlob()
        const file = new File([blob], posterFileName(), { type: 'image/png' })

        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: schedule.value.title,
                text: 'Scan to order from this Pasabuy schedule.',
                files: [file]
            })
        } else {
            await navigator.share({
                title: schedule.value.title,
                text: `Scan to order from this Pasabuy schedule: ${props.workspace.publicLink}`,
                url: props.workspace.publicLink
            })
        }
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            toast.add({ title: 'Share failed', description: (error as Error).message, color: 'error' })
        }
    } finally {
        sharing.value = false
    }
}
</script>
