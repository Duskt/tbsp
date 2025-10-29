import type { TbspWsMsgProtocol } from '@tbsp/web/tbsp';
import { TbspWebSocketClient } from '@tbsp/web/tbsp';
import type { ClientWebSocketController } from '@tbsp/web/types.ts';

export const ws: ClientWebSocketController<TbspWsMsgProtocol> = new TbspWebSocketClient('/');
