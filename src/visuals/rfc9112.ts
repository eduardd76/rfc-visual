import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 9112. Every quote is verbatim RFC text (whitespace
// collapsed) and is checked against the RFC by scripts/validate-visual.ts.
export const rfc9112: RfcVisualModel = {
  rfc: 9112,
  reviewed: false,
  states: [],
  transitions: [],
  sequences: [
    {
      id: "request-response",
      title: "Request and response",
      participants: { a: "Client", b: "Server" },
      intro: { section: "2.1", quote: "A message can be either a request from client to server or a response from server to client." },
      steps: [
        { from: "A", segment: "GET /where?q=now HTTP/1.1",
          explain: "To fetch http://www.example.org/where?q=now directly from the origin server, the client sends only the path and query as the request-target, followed by a Host header field.",
          cite: { section: "3.2.1", quote: "GET /where?q=now HTTP/1.1 Host: www.example.org" } },
        { from: "B", segment: "status-line = HTTP-version SP status-code SP [ reason-phrase ]",
          explain: "The response starts with a status-line: the protocol version, a 3-digit status code, and an optional textual reason phrase.",
          cite: { section: "4", quote: "status-line = HTTP-version SP status-code SP [ reason-phrase ]" } },
      ],
    },
    {
      id: "persistence",
      title: "Persistent connection and close",
      participants: { a: "Client", b: "Server" },
      intro: { section: "9.3", quote: "HTTP/1.1 defaults to the use of \"persistent connections\", allowing multiple requests and responses to be carried over a single connection." },
      steps: [
        { from: "A", segment: "HTTP/1.1",
          explain: "The server receives an HTTP/1.1 request without a \"close\" connection option, so the connection will stay open after the response.",
          cite: { section: "9.3", quote: "If the received protocol is HTTP/1.1 (or later), the connection will persist after the current response; else," } },
        { from: "B", segment: "response",
          explain: "HTTP/1.1 has no request identifier: a response is matched to its request by order on the connection.",
          cite: { section: "9.2", quote: "Hence, it relies on the order of response arrival to correspond exactly to the order in which requests are made on the same connection." } },
        { from: "A", segment: "Connection: close",
          explain: "The client sends a further request carrying Connection: close, saying this is the last request it will send on this connection.",
          cite: { section: "9.6", quote: "Connection: close as a request header field indicates that this is the last request that the client will send on this connection" } },
        { from: "B", segment: "final response",
          explain: "The server sends the final response to that request and then must start closing the connection.",
          cite: { section: "9.6", quote: "A server that receives a \"close\" connection option MUST initiate closure of the connection (see below) after it sends the final response to the request that contained the \"close\" connection option." } },
      ],
    },
  ],
  headers: [],
  notShown: [
    "Header field line syntax and obsolete line folding (§5)",
    "Message body length: Transfer-Encoding, Content-Length and chunked coding (§6, §7)",
    "Other request-target forms: absolute-form, authority-form, asterisk-form (§3.2)",
    "HTTP/1.0 keep-alive rules (§9.3)",
    "Pipelining and retrying requests (§9.3.1, §9.3.2)",
    "Staged server close to avoid the TCP reset problem (§9.6)",
    "TLS connection initiation and closure (§9.7, §9.8)",
  ],
};
