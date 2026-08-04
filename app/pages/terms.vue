<template>
    <LegalPageShell title="Terms of Service" last-updated="July 21, 2026">
        <TermsContent />
        <p>
            See our
            <NuxtLink :to="{ path: '/privacy', query: route.query }" class="text-primary hover:underline">Privacy Policy</NuxtLink>
            for how we handle your information.
        </p>
    </LegalPageShell>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

useHead({ title: 'Terms of Service' })

const route = useRoute()
const { markViewed } = useLegalAcknowledgement()

onMounted(() => {
    markViewed()
})
</script>
