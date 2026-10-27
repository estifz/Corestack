export const isJsonParseError = (error: unknown): boolean => {
    return (
        error instanceof SyntaxError &&
        'body' in error &&
        'status' in error &&
        error.status === 400
    )
}
