<template>
    <UApp :toaster="{ position: 'top-center', duration: 4000 }">
        <PullToRefresh />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <CookieConsentBanner />
    </UApp>
</template>
