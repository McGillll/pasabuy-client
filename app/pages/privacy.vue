<template>
    <LegalPageShell title="Privacy Policy" last-updated="July 21, 2026">
        <PrivacyContent />
        <p>
            See our
            <NuxtLink :to="{ path: '/terms', query: route.query }" class="text-primary hover:underline">Terms of Service</NuxtLink>
            for related details.
        </p>
    </LegalPageShell>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

useHead({ title: 'Privacy Policy' })

const route = useRoute()
const { markViewed } = useLegalAcknowledgement()

onMounted(() => {
    markViewed()
})
</script>
