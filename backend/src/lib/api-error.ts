// Thrown from anywhere in a route handler; withErrorHandling() turns this into
// a plain-text response with the given status, matching the frontend's
// api.ts, which reads response.text() as the error message.
export class ApiError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
