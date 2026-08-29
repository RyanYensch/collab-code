export const MESSAGE_DOCUMENT_UPDATE = 0;
export const MESSAGE_AWARENESS_UPDATE = 1;

export interface BinaryMessage {
    type: number;
    payload: Uint8Array;
}

export function encodeBinaryMessage(
    type: number,
    payload: Uint8Array,
): ArrayBuffer {
    const buffer = new ArrayBuffer(payload.byteLength + 1);
    const bytes = new Uint8Array(buffer);

    bytes[0] = type;
    bytes.set(payload, 1);

    return buffer;
}

export function decodeBinaryMessage(
    buffer: ArrayBuffer,
): BinaryMessage | null {
    if (buffer.byteLength < 1) {
        return null;
    }

    const bytes = new Uint8Array(buffer);
    return {
        type: bytes[0],
        payload: bytes.subarray(1),
    };
}