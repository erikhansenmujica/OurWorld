export function socketPulse(socket: WebSocket, interval = 1000) {
  setInterval(() => {
    socket.send(
      JSON.stringify({
        operation: "rpc",
        type: "query",
        data: [],
      })
    );
  }, interval);
}
