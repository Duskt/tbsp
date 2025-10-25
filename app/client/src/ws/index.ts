import { CWSController } from '@tbsp/web';
import { write } from '@tbsp/web/tbsp';
import type { ClientWebSocketController } from '@tbsp/web/types.ts';
import type { TbspWsMsgProtocol } from '@tbsp/web/tbsp';

const ws: ClientWebSocketController<TbspWsMsgProtocol> = new CWSController<TbspWsMsgProtocol>(
  '/',
  write,
);
export default ws;
