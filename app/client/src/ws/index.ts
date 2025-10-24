import { CWSController } from '@tbsp/web';
import type { ClientWebSocketController } from '@tbsp/web/types.ts';

const ws: ClientWebSocketController = new CWSController('/');
export default ws;
