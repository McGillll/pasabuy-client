export function useAsyncClipboard() {
    async function copyTextAsync(getText: () => Promise<string>): Promise<string> {
        if (typeof ClipboardItem !== 'undefined') {
            let resolvedText = ''
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': getText().then((text) => {
                        resolvedText = text
                        return new Blob([text], { type: 'text/plain' })
                    })
                })
            ])
            return resolvedText
        }

        const text = await getText()
        await navigator.clipboard.writeText(text)
        return text
    }

    return { copyTextAsync }
}
