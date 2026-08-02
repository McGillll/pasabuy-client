interface APIErrorPayload {
    message: string
    errors?: Record<string, string[]>
    status?: number
}

class APIError extends Error {
    errors?: Record<string, string[]>
    status?: number

    constructor(error: APIErrorPayload) {
        super(error.message)
        Object.setPrototypeOf(this, APIError.prototype)
        if (error.errors) {
            this.errors = error.errors
        }
        this.status = error.status
    }

    getErrorMessage() {
        return 'Something went wrong: ' + this.message
    }
}
export default APIError
