import { Agent, buildConnector } from 'undici';
import axios, { AxiosInstance } from 'axios';
import dns from 'node:dns';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { isBlockedIp, isSafePublicHttpsUrl } from './webhook.url.validator';

// Pins DNS resolution: every resolved IP is checked with `isBlockedIp` and
// the caller connects to that same set. Closes the TOCTOU window
// `isSafePublicHttpsUrl` alone leaves open (see GHSA-f7jj-p389-4w45).
function ssrfSafeLookup(
  hostname: string,
  options: any,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: any,
    family?: number
  ) => void
) {
  if (net.isIP(hostname)) {
    const family = net.isIP(hostname);
    if (isBlockedIp(hostname)) {
      return callback(new Error('Blocked IP'), '', 0);
    }
    return options && (options as any).all
      ? callback(null, [{ address: hostname, family }] as any, family)
      : callback(null, hostname, family);
  }

  dns.lookup(hostname, options, (err, address: any, family: any) => {
    if (err) return callback(err, '', 0);
    if (Array.isArray(address)) {
      for (const entry of address) {
        if (isBlockedIp(entry.address)) {
          return callback(new Error('Blocked IP'), '', 0);
        }
      }
      return callback(null, address as any, 0);
    }
    if (isBlockedIp(address)) {
      return callback(new Error('Blocked IP'), '', 0);
    }
    callback(null, address, family);
  });
}

// Dímelo Redes (RED-06, V6-N03): Node and undici never call `lookup` when the
// host is already an IP literal, so the check above alone let
// `https://127.0.0.1/` and any redirect to an internal IP straight through.
// The connector checks the literal before connecting and, once connected,
// the address the socket really reached, for every connection (every
// redirect hop opens its own) and before a single byte is sent.
const baseConnector = buildConnector({ lookup: ssrfSafeLookup } as any);
const ssrfSafeConnector: buildConnector.connector = (options, callback) => {
  const host = String(options.hostname || '').replace(/^\[|\]$/g, '');
  if (net.isIP(host) && isBlockedIp(host)) {
    return callback(new Error('Blocked IP'), null);
  }
  return baseConnector(options, (err, socket) => {
    if (err || !socket) {
      return callback(err, null);
    }
    const reached = socket.remoteAddress;
    if (!reached || isBlockedIp(reached)) {
      socket.destroy();
      return callback(new Error('Blocked IP'), null);
    }
    return callback(null, socket);
  });
};

export const ssrfSafeDispatcher = new Agent({
  connect: ssrfSafeConnector,
});

// The same for Node's http(s) agents (axios): an IP literal never reaches
// `lookup`, so it is checked before the socket is opened.
const blockLiteral = (options: any) => {
  const host = String(options?.host || options?.hostname || '').replace(
    /^\[|\]$/g,
    ''
  );
  if (net.isIP(host) && isBlockedIp(host)) {
    throw new Error('Blocked IP');
  }
};
class SsrfSafeHttpAgent extends http.Agent {
  createConnection(options: any, callback?: any) {
    blockLiteral(options);
    // @ts-ignore — present at runtime, not in the typings
    return super.createConnection(options, callback);
  }
}
class SsrfSafeHttpsAgent extends https.Agent {
  createConnection(options: any, callback?: any) {
    blockLiteral(options);
    // @ts-ignore — present at runtime, not in the typings
    return super.createConnection(options, callback);
  }
}

const MAX_REDIRECTS = 3;

// Downloads a user-given address (Dímelo Redes, RED-06): only https, only to
// public addresses, every redirect checked again before following it (at
// most 3), and the whole download has a deadline. The size cap stays with the
// caller, which reads the body.
export async function fetchPublicHttps(
  url: string,
  init: RequestInit = {},
  timeoutMs = 300_000
): Promise<Response> {
  const signal = AbortSignal.timeout(timeoutMs);
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isSafePublicHttpsUrl(current))) {
      throw new Error('Blocked URL');
    }
    const response = await fetch(current, {
      ...init,
      redirect: 'manual',
      signal,
      // @ts-ignore — undici option, not in lib.dom fetch types
      dispatcher: ssrfSafeDispatcher,
    });
    if (response.status < 300 || response.status > 399) {
      return response;
    }
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location) {
      throw new Error('Redirect without location');
    }
    current = new URL(location, current).toString();
  }
  throw new Error('Too many redirects');
}

// axios can't use an undici dispatcher, but Node's http(s) agents accept the
// same `lookup` hook, so axios requests (providers that need form-data /
// stream uploads) get the identical pinned-DNS guard as `this.fetch`.
const ssrfSafeAxios = axios.create({
  httpAgent: new SsrfSafeHttpAgent({
    lookup: ssrfSafeLookup,
  } as http.AgentOptions),
  httpsAgent: new SsrfSafeHttpsAgent({
    lookup: ssrfSafeLookup,
  } as https.AgentOptions),
});

// Self-hosters legitimately connect Postiz to WordPress/Mastodon/Lemmy/Listmonk
// instances that live on a private network (e.g. the same Docker network or VPC).
// Setting DISABLE_SSRF_PROTECTION=true opts those deployments out of the IP
// guard. It stays ON by default so the hosted product is protected.
export function getSsrfSafeDispatcher(): Agent | undefined {
  return process.env.DISABLE_SSRF_PROTECTION === 'true'
    ? undefined
    : ssrfSafeDispatcher;
}

export function getSsrfSafeAxios(): AxiosInstance {
  return process.env.DISABLE_SSRF_PROTECTION === 'true' ? axios : ssrfSafeAxios;
}
