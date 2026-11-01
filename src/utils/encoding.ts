function reverse(value: string): string {
    return Array.from(value).reverse().join('')
}

function toLatin1(bytes: Uint8Array): string {
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return binary
}

export function encodeIdolName(name: string): string {
    const reversed = reverse(name)
    return btoa(toLatin1(new TextEncoder().encode(reversed)))
}

export function decodeIdolName(encoded: string): string {
    try {
        const binary = atob(encoded)
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
        return reverse(new TextDecoder().decode(bytes))
    } catch {
        return ''
    }
}


