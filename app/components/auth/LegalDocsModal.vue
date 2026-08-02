<template>
    <BaseModal :open="open" title="Terms & Privacy" description="Please review before continuing." size="lg" @update:open="onUpdateOpen">
        <BaseTabs v-model="activeTab" :items="tabItems">
            <template #terms>
                <div class="flex max-h-[50dvh] flex-col gap-6 overflow-y-auto pr-1 text-sm leading-relaxed text-default">
                    <TermsContent />
                </div>
            </template>
            <template #privacy>
                <div class="flex max-h-[50dvh] flex-col gap-6 overflow-y-auto pr-1 text-sm leading-relaxed text-default">
                    <PrivacyContent />
                </div>
            </template>
        </BaseTabs>

        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <BaseButton color="neutral" variant="soft" @click="onCancel">
                    Cancel
                </BaseButton>
                <BaseButton @click="onAgree">
                    I've read this, agree
                </BaseButton>
            </div>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const props = defineProps<{
    open: boolean
    initialTab?: 'terms' | 'privacy'
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    agree: []
}>()

const activeTab = ref(props.initialTab ?? 'terms')

watch(() => props.open, (value) => {
    if (value) activeTab.value = props.initialTab ?? 'terms'
})

const tabItems: TabsItem[] = [
    { label: 'Terms of Service', value: 'terms', slot: 'terms' },
    { label: 'Privacy Policy', value: 'privacy', slot: 'privacy' }
]

function onUpdateOpen(value: boolean) {
    emit('update:open', value)
}

function onCancel() {
    emit('update:open', false)
}

function onAgree() {
    emit('agree')
    emit('update:open', false)
}
</script>
