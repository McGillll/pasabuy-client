import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    window.Pusher = Pusher

    const echo = new Echo({
        broadcaster: 'pusher',
        key: config.public.wsAppKey,
        cluster: 'mt1',
        wsHost: config.public.wsHost,
        wsPort: Number(config.public.wsPort),
        wssPort: Number(config.public.wsPort),
        forceTLS: config.public.wsScheme === 'https',
        enabledTransports: ['ws', 'wss']
    })

    return {
        provide: {
            echo
        }
    }
})
