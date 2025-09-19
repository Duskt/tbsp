import { ref, onMounted, onUnmounted } from 'vue'

/* FOR USE IN VIEWS - you don't want more than one WS connection per client! (?)
 * Using this 'composable' function in a component will allow access
 * to a WS connection which exists only when the component is rendered.
 */
export default function useWS(path: string = "/", onmessage: (msg: MessageEvent) => void = () => {}) {
  const ws = new WebSocket(path)
  ws.onmessage = onmessage
  onUnmounted(() => { ws.close();})

  return { ws }
}
