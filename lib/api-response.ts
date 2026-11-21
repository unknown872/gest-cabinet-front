export function unwrapApiResponse(body: unknown): unknown {
    if (
        typeof body === 'object'
        && body !== null
        && 'success' in body
        && 'data' in body
    ) {
        return body.data
    }
    return body
}
