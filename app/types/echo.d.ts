import type Echo from 'laravel-echo'
import type Pusher from 'pusher-js'

declare module '#app' {
    interface NuxtApp {
        $echo: Echo<'pusher'>
    }
}

declare global {
    interface Window {
        Pusher: typeof Pusher
    }
}

export {}
