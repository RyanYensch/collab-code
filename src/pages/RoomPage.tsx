import { useEffect, useState } from "preact/hooks";
import * as Y from "yjs";
import { CodeEditor } from "../components/CodeEditor";
import { RoomProvider, type RoomConnectionStatus } from "../collaboration/RoomProvider";
import { CODE_TEXT_KEY, STARTER_CODE } from "../../shared/editor";
import "../app.css";

interface ActiveUser {
  clientId: number;
  name: string;
  color: string;
  local: boolean;
}

interface RoomPageProps {
  roomId: string;
}

const USER_COLORS = [
  "#e57373",
  "#64b5f6",
  "#81c784",
  "#ba68c8",
  "#ffb74d",
  "#4dd0e1",
  "#f06292",
  "#aed581",
];

function createTemporaryUser (
  clientId: number,
) {
  return {
    name: `Guest ${clientId % 10000}`,
    color: USER_COLORS[clientId % USER_COLORS.length]
  };
}


export function RoomPage({
  roomId
}: RoomPageProps) {
  const [document] = useState(() => new Y.Doc());
  const [status, setStatus] = useState<RoomConnectionStatus>("Connecting");
  const [connections, setConnections] = useState(0);
  const [provider] = useState(
    () => new RoomProvider(
      roomId,
      document,
      {
        onStatusChange: setStatus,
        onConnectionsChange: setConnections
      },
    ),
  );
  const [user] = useState(() => createTemporaryUser(document.clientID));
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);


  const code = document.getText(CODE_TEXT_KEY);

  // New provider on room id or document change
  useEffect(() => {
    provider.setUser(user)
    provider.connect();

    return () => {
      provider.destroy();
      document.destroy();
    };
  }, [provider, document, user]);

  useEffect(() => {
    const updateUsers =
      (): void => {
        const users: ActiveUser[] = [];

        for (const [clientId, state] of provider.awareness.getStates()) {
          const rawUser = (
            state as {
              user?: {
                name?: unknown;
                color?: unknown;
              }
            }
          ).user;

          if (typeof rawUser?.name !== "string" || typeof rawUser?.color !== "string") {
            continue;
          }

          users.push({
            clientId,
            name: rawUser.name,
            color: rawUser.color,
            local: clientId === document.clientID,
          });
        }

        setActiveUsers(
          users.sort(
            (a, b) => a.name.localeCompare(b.name),
          )
        );
      };

      provider.awareness.on(
        "change",
        updateUsers,
      );

      updateUsers();

      return () => {
        provider.awareness.off(
          "change",
          updateUsers,
        );
      };
  }, [provider, document]);

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
            {" - "}
            {status}
            {" - "}
            {connections} connected
          </span>

          <div class="user-list">
            {activeUsers.map(
              (activeUser) => (
                <span
                  key={activeUser.clientId}
                  class="user-pill"
                >
                  <span
                    class="user-dot"
                    style={{
                      background: activeUser.color,
                    }}
                  />

                  {activeUser.name}

                  {activeUser.local && " (you)"}
                </span>
              )
            )}
          </div>
        </div>

        <div class="actions">
          <a
            class="home-link"
            href="/"
          >
            Home
          </a>

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
          </div>

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
        </aside>

        <section class="editor-panel">
          <div class="file-tabs">
            <div class="file-tab active">
              main.cpp
            </div>
          </div>

          <CodeEditor
            yText={code}
            awareness={provider.awareness}
            language="cpp"
            readOnly={ status !== "Connected" }
          />
        </section>
      </section>
    </main>
  )
}