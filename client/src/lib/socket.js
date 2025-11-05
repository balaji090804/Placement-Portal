import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    const email = (
      localStorage.getItem("studentEmail") ||
      localStorage.getItem("email") ||
      ""
    ).toLowerCase();
    socket = io("http://localhost:8080", {
      transports: ["websocket", "polling"],
      query: { email },
    });
  }
  return socket;
}

export function onEvent(event, handler) {
  const s = getSocket();
  s.on(event, handler);
  return () => s.off(event, handler);
}
