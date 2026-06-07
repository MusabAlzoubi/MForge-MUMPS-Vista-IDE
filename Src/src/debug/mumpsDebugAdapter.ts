interface DapMessage { seq?: number; type: 'request' | 'response' | 'event'; command?: string; event?: string; request_seq?: number; success?: boolean; body?: unknown; arguments?: Record<string, unknown>; }

let sequence = 1;
let buffer = Buffer.alloc(0);
let connected = false;

process.stdin.on('data', (chunk: Buffer) => {
  buffer = Buffer.concat([buffer, chunk]);
  processMessages();
});

function processMessages(): void {
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd < 0) return;
    const header = buffer.slice(0, headerEnd).toString('utf8');
    const lengthMatch = /Content-Length: (\d+)/iu.exec(header);
    if (!lengthMatch?.[1]) return;
    const length = Number(lengthMatch[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;
    if (buffer.length < messageEnd) return;
    const payload = buffer.slice(messageStart, messageEnd).toString('utf8');
    buffer = buffer.slice(messageEnd);
    handleMessage(JSON.parse(payload) as DapMessage);
  }
}

function handleMessage(message: DapMessage): void {
  if (message.type !== 'request' || !message.command) return;
  switch (message.command) {
    case 'initialize':
      respond(message, {
        supportsConfigurationDoneRequest: true,
        supportsEvaluateForHovers: true,
        supportsConditionalBreakpoints: true,
        supportsBreakpointLocationsRequest: true,
        supportsExceptionInfoRequest: true,
        supportsRestartRequest: true
      });
      sendEvent('initialized');
      break;
    case 'launch':
    case 'attach':
      connected = true;
      respond(message);
      sendEvent('stopped', { reason: 'entry', threadId: 1 });
      break;
    case 'configurationDone':
    case 'setBreakpoints':
      respond(message, message.command === 'setBreakpoints' ? { breakpoints: [] } : undefined);
      break;
    case 'threads':
      respond(message, { threads: [{ id: 1, name: 'MDEBUG thread' }] });
      break;
    case 'stackTrace':
      respond(message, { stackFrames: [], totalFrames: 0 });
      break;
    case 'scopes':
      respond(message, { scopes: [] });
      break;
    case 'variables':
      respond(message, { variables: [] });
      break;
    case 'continue':
    case 'next':
    case 'stepIn':
    case 'stepOut':
      respond(message);
      sendEvent('stopped', { reason: 'step', threadId: 1 });
      break;
    case 'evaluate':
      respond(message, { result: 'MDEBUG evaluate is available when connected to a live MDEBUG server.', variablesReference: 0 });
      break;
    case 'mumps.rawCommand': {
      const command = String(message.arguments?.command ?? '');
      respond(message, { accepted: connected, command, message: `MDEBUG direct-command bridge accepted: ${command}` });
      break;
    }
    case 'disconnect':
      connected = false;
      respond(message);
      sendEvent('terminated');
      break;
    default:
      respond(message);
  }
}

function respond(request: DapMessage, body?: unknown): void {
  send({ type: 'response', seq: sequence++, request_seq: request.seq, command: request.command, success: true, body });
}

function sendEvent(event: string, body?: unknown): void {
  send({ type: 'event', seq: sequence++, event, body });
}

function send(message: DapMessage): void {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`);
}
