export const ROOM_CODE_PATTERN = /^[a-z0-9_-]{1,64}$/;

const GENERATED_ROOM_ALPHABET =
    "abcdefghijklmnopqrstuvwxyz234567"; // 32 characters (5 bits)

const GENERAED_ROOM_LENGTH = 8;

export function normaliseRoomCode(
    value: string,
): string {
    return value.trim().toLowerCase();
}

export function isValidRoomCode(
    value: string,
): boolean {
    return ROOM_CODE_PATTERN.test(value);
}

export function createRoomCode(): string {
    const randomBytes = new Uint8Array(GENERAED_ROOM_LENGTH);

    crypto.getRandomValues(randomBytes);

    let result = "";

    for (const value of randomBytes) {
        result += GENERATED_ROOM_ALPHABET[value & 31];
    }

    return result;
}

export function getRoomPath(
    roomId: string,
): string {
    return `/room/${roomId}`;
}