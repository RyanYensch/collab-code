import { useEffect, useRef, useState } from "preact/hooks";
import { CodeEditor } from "./components/CodeEditor";
import "./app.css";

const starterCode = `#include <iostream>
#include <vector>

using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& nums) {

    }
};
`


// interface RoomEvent {
//   type: string,
//   sessionId?: string,
//   text?: string,
//   connections?: number
// }

// export function App() {
//   const socketRef = useRef<WebSocket | null>(null);

//   const [roomId, setRoomId] = useState("test");
//   const [message, setMessage] = useState("");
//   const [status, setStatus] = useState("Disconnected");
//   const [connections, setConnections] = useState(0);
//   const [events, setEvents] = useState<string[]>([]);

//   useEffect(() => {
//     return () => {
//       socketRef.current?.close();
//     };
//   }, []);

//   function addEvent(text: string) {
//     setEvents((current) => [
//       ...current.slice(-49),
//       text,
//     ]);
//   }

//   function connect() {
//     const cleanRoomId = roomId.trim().toLowerCase();

//     if (!/^[a-z0-9_-]{1,64}$/.test(cleanRoomId)) {
//       addEvent("Invalid Room ID");
//       return;
//     }

//     socketRef.current?.close();

//     const protocol = window.location.protocol === "https: " ? "wss" : "ws";

//     const socket = new WebSocket(`${protocol}://${window.location.host}/ws/rooms/${cleanRoomId}`);

//     socketRef.current = socket;

//     setStatus("Connecting...");

//     socket.addEventListener("open", () => {
//       setStatus("Connected");
//       addEvent(`Joined room "${cleanRoomId}"`);
//     });

//     socket.addEventListener("message", (event) => {
//       const data = JSON.parse(event.data) as RoomEvent;

//       if (typeof data.connections === "number") {
//         setConnections(data.connections);
//       }

//       if (data.type === "message" && data.text && data.sessionId) {
//         addEvent(`${data.sessionId.slice(0, 8)}: ${data.text}`);
//       }
//     });

//     socket.addEventListener("close", () => {
//       setStatus("Disconnected");
//       setConnections(0);
//     });

//     socket.addEventListener("error", () => {
//       addEvent("WebSocket error");
//     });
//   }

//   function sendMessage() {
//     const socket = socketRef.current;

//     if (!socket || socket.readyState !== WebSocket.OPEN) {
//       addEvent("Not Connected");
//       return;
//     }

//     const text = message.trim();

//     if (!text) {
//       return;
//     }

//     socket.send(text);

//     setMessage("");
//   }


//   return (
//     <main class="app">
//       <h1>Collab Code</h1>

//       <p>
//         Durable object room communication test
//       </p>

//       <section>
//         <label for="room">Room</label>

//         <div class="row">
//           <input
//             id="room"
//             value={roomId}
//             onInput={(event) => {
//               setRoomId(event.currentTarget.value);
//             }} />

//           <button onClick={connect}>
//             Join Room
//           </button>
//         </div>
//       </section>

//       <section>
//         <p>
//           Status: <strong>{status}</strong>
//         </p>

//         <p>
//           Connected users: <strong>{connections}</strong>
//         </p>
//       </section>

//       <form
//         onSubmit={(event) => {
//           event.preventDefault();
//           sendMessage();
//         }}
//       >
//         <label for="message">Message</label>

//         <div class="row">
//           <input
//             id="message"
//             value={message}
//             onInput={(event) => {
//               setMessage(event.currentTarget.value);
//             }}
//           />

//           <button type="submit">
//             Send
//           </button>
//         </div>

//       </form>

//       <section>
//         <h2>Room Events</h2>

//         <pre>
//           {events.length ? events.join("\n") : "No Events Yet."}
//         </pre>
//       </section>
//     </main>
//   )
// }


export function App() {
  const [code, setCode] = useState(starterCode);

  return (
    <main class="app">
      <header class="top-bar">
        <div>
          <h1>Collab Code</h1>

          <span class="room-name">
            Local Editor
          </span>
        </div>

        <div class="actions">
          <span class="languages">
            C++20
          </span>

          <button
            type="button"
            onClick={() => {
              setCode(starterCode);
            }}
          >
            Reset
          </button>

          <button
            type="button"
            disabled
            title="Code execution not implemented"
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
          </div>

          <h2>Example Problem</h2>

          <p>
            Eventually will contain problem description, examples, constaints, and test cases.
          </p>

          <h3>Example</h3>

          <pre>
{`Input:
nums = [2, 7, 11, 15]

Output:
[0, 1]`}
          </pre>

          <h3>Contstaints</h3>

          <ul>
            <li>
              {`1 <= nums.length <= 10000`}
            </li>

            <li>
              {`Values may be negative`}
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
            value={code}
            language="cpp"
            onChange={setCode}
          />
        </section>
      </section>
    </main>
  )
}