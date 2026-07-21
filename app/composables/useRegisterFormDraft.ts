export interface RegisterFormState {
    first_name: string
    last_name: string
    email: string
    contact_number: string
    messenger_name: string
    password: string
    password_confirmation: string
    terms_accepted: boolean
}

function emptyRegisterForm(): RegisterFormState {
    return {
        first_name: '',
        last_name: '',
        email: '',
        contact_number: '',
        messenger_name: '',
        password: '',
        password_confirmation: '',
        terms_accepted: false,
    }
}

export function useRegisterFormDraft() {
    const state = useState<RegisterFormState>('register_form_draft', emptyRegisterForm)

    function reset() {
        state.value = emptyRegisterForm()
    }

    return { state, reset }
}
