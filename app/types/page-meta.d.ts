declare module '#app' {
    interface PageMeta {
        // Which side the brand panel sits on in layouts/auth.vue (desktop only).
        authPanel?: 'left' | 'right'
    }
}

export {}
