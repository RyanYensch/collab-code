import { useState } from "preact/hooks";
import {
    createRoomCode,
    getRoomPath,
    isValidRoomCode,
    normaliseRoomCode,
} from "../lib/rooms";

import "./HomePage.css"

export function HomePage() {
    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    function goToRoom(
        roomId: string,
    ): void {
        window.location.assign(getRoomPath(roomId));
    }

    function createRoom(): void {
        const roomId = createRoomCode();
        goToRoom(roomId);
    }

    function joinRoom(
        event: Event,
    ): void {
        event.preventDefault();

        const cleanedRoomCode = normaliseRoomCode(roomCode);

        if (!isValidRoomCode(cleanedRoomCode)) {
            setError("Enter a valid room code.");
            return;
        }

        setError(null);

        goToRoom(cleanedRoomCode);
    }

    return (
        <main class="home-page">
            <div class="home-card">
                <header class="home-header">
                    <h1>
                        Collab Code
                    </h1>

                    <p>
                        Solve coding problems together.
                    </p>
                </header>

                <section class="create-room">
                    <h2>
                        Create a Room
                    </h2>

                    <p>
                        Create a room and share the code.
                    </p>

                    <button
                        type="button"
                        class="primary-button"
                        onClick={createRoom}
                    >
                        Create New Room
                    </button>
                </section>

                <div
                    class="home-divider"
                    aria-hidden="true"
                >
                    <span>
                        or
                    </span>
                </div>

                <form
                    class="join-room"
                    onSubmit={joinRoom}
                >
                    <h2>
                        Join a Room
                    </h2>

                    <label for="room-code">
                        Room Code
                    </label>

                    <div class="join-now">
                        <input
                            id="room-code"
                            type="text"
                            value={roomCode}
                            placeholder="e.g. abcd1234"
                            maxLength={10}
                            autoComplete="off"
                            spellcheck={false}
                            onInput={(
                                event,
                            ) => {
                                setRoomCode(event.currentTarget.value);
                                setError(null);
                            }}
                        />

                        <button
                            type="submit"
                            disabled={roomCode.trim().length === 0}
                        >
                            Join
                        </button>
                    </div>

                    {error && (
                        <p
                            class="room-error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </main>
    );
}