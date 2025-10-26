import type { ClientWebSocketController } from '@tbsp/web/types.ts';
import type { TbspWsMsgProtocol } from '@tbsp/web/tbsp';
import { TbspWebSocketClient } from '@tbsp/web/tbsp';

const ws: ClientWebSocketController<TbspWsMsgProtocol> = new TbspWebSocketClient('/');
export default ws;
