export function useLegalAcknowledgement() {
    const hasViewedLegalDocs = useState<boolean>('has_viewed_legal_docs', () => false)

    function markViewed() {
        hasViewedLegalDocs.value = true
    }

    return { hasViewedLegalDocs, markViewed }
}
