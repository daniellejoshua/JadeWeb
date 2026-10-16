const ASSISTANT_MEMORY_PREFIX = 'jade-assistant:v1:';

export function assistantMemoryKey(userId: string): string {
    return `${ASSISTANT_MEMORY_PREFIX}${userId}`;
}

export function clearAssistantMemory(userId: string): void {
    try {
        window.sessionStorage.removeItem(assistantMemoryKey(userId));
    } catch {
        // Storage can be unavailable in hardened browser contexts.
    }
}

export function clearAllAssistantMemory(): void {
    try {
        Object.keys(window.sessionStorage)
            .filter((key) => key.startsWith(ASSISTANT_MEMORY_PREFIX))
            .forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
        // Logging out must still work when browser storage is unavailable.
    }
}
