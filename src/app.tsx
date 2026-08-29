import { HomePage } from "./pages/HomePage";
import { RoomPage } from "./pages/RoomPage";
import { isValidRoomCode, normaliseRoomCode } from "./lib/rooms";

function getRoomIdFromPath(): string | null {
    const match = window.location.pathname.match(/^\/room\/([a-zA-Z0-9_-]{1,64})$/);

    if (!match) {
        return null;
    }

    const roomId = normaliseRoomCode(match[1]);

    if (!isValidRoomCode(roomId)) {
        return null;
    }

    return roomId;
}


export function App() {
    const path = window.location.pathname;

    if (path === "/" || path === "") {
        return <HomePage />
    }

    const roomId = getRoomIdFromPath()

    if (roomId) {
        return (
            <RoomPage roomId={roomId} />
        );
    }

    return (
        <main class="home-page">
            <div class="home-card">
                <h1>
                    Page not found
                </h1>

                <p>
                    The requested page does not exist.
                </p>

                <a
                    class="home-link"
                    href="/"
                >
                    Back to Home
                </a>
            </div>
        </main>
    );
}