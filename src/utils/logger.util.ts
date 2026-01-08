export function log(
    message: string,
    context?: string,
    data?: any,
) {
    const timestamp = new Date().toISOString();

    console.log(
        `[${timestamp}]`,
        context ? `[${context}]` : '',
        message,
        data ?? '',
    );
}