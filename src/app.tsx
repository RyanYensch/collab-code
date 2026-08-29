import { useEffect, useState } from "preact/hooks";
import * as Y from "yjs";
import { CodeEditor } from "./components/CodeEditor";
import { RoomProvider, type RoomConnectionStatus } from "./collaboration/RoomProvider";
import { CODE_TEXT_KEY, STARTER_CODE } from "../shared/editor";
import "./app.css";

function getInitialRoomId(): string {
  const params = new URLSearchParams(
    window.location.search,
  );

  const requestedRoom = params.get("room")?.trim().toLowerCase();

  if (requestedRoom && /^[a-zA-Z0-9_-]{1,64}$/.test(requestedRoom)) {
    return requestedRoom;
  }

  return "test";
}


export function App() {
  const [roomId] = useState(getInitialRoomId);
  const [document] = useState(() => new Y.Doc());
  const [status, setStatus] = useState<RoomConnectionStatus>("Connecting");
  const [connections, setConnections] = useState(0);
  const code = document.getText(CODE_TEXT_KEY);

  // New provider on room id or document change
  useEffect(() => {
    const provider = new RoomProvider(
      roomId,
      document,
      {
        onStatusChange: setStatus,
        onConnectionsChange: setConnections,
      },
    );

    provider.connect();

    return () => {
      provider.destroy();
      document.destroy();
    };
  }, [roomId, document]);

  function resetCode(): void {
    document.transact(
      () => {
        code.delete(0, code.length);
        code.insert(0, STARTER_CODE);
      },
      "reset",
    );
  }

  return (
    <main class="app">
      <header class="top-bar">
        <div>
          <h1>Collab Code</h1>

          <span class="room-name">
            Room: {roomId}
            {" . "}
            {status}
            {" . "}
            {connections} connected
          </span>
        </div>

        <div class="actions">
          <span class="language">
            C++20
          </span>

          <button
            type="button"
            disabled={
              status !== "Connected"
            }
            onClick={resetCode}
          >
            Reset
          </button>

          <button
            type="button"
            disabled
            title="Code Execution To Be Implemented"
          >
            Run
          </button>
        </div>
      </header>

      <section class="workspace">
        <aside class="problem-panel">
          <div class="problem-header">
            <span class="problem-number">
              Problem 1
            </span>

            <span class="difficulty">
              Easy
            </span>

            <h2>
              Example Problem
            </h2>

            <p>
              Eventually will have real problem description, examples, contraints and tests.
            </p>

            <h3>
              Example
            </h3>

            <pre>
{`Input:
nums = [2, 7, 11, 15]

Output:
[0, 1]`}
            </pre>

            <h3>
              Constraints
            </h3>

            <ul>
              <li>
                1 &lt;= nums.length
              </li>

              <li>
                Values may be negative
              </li>
            </ul>
          </div>
        </aside>

        <section class="editor-panel">
          <div class="file-tabs">
            <div class="file-tab active">
              main.cpp
            </div>
          </div>

          <CodeEditor
            yText={code}
            language="cpp"
            readOnly={ status !== "Connected" }
          />
        </section>
      </section>
    </main>
  )
}