## GitHub Copilot Chat

- Extension: 0.40.1 (prod)
- VS Code: 1.112.0 (07ff9d6178ede9a1bd12ad3399074d726ebe6e43)
- OS: win32 10.0.19045 x64
- GitHub Account: dutryJll

## Network

User Settings:

```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:

- DNS ipv4 Lookup: Error (3 ms): getaddrinfo ENOTFOUND api.github.com
- DNS ipv6 Lookup: Error (1 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (3 ms)
- Electron fetch (configured): Error (24 ms): Error: net::ERR_NAME_NOT_RESOLVED
  at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
  at SimpleURLLoaderWrapper.emit (node:events:519:28)
  at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:130:17)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (43 ms): Error: getaddrinfo ENOTFOUND api.github.com
  at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (65 ms): TypeError: fetch failed
  at node:internal/deps/undici/undici:14902:13
  at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
  at async n.\_fetch (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5104:5227)
  at async n.fetch (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5104:4539)
  at async u (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5136:186)
  at async dg.\_executeContributedCommand (file:///c:/Users/HP/AppData/Local/Programs/Microsoft%20VS%20Code/07ff9d6178/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND api.github.com
  at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://api.githubcopilot.com/_ping:

- DNS ipv4 Lookup: Error (1 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- DNS ipv6 Lookup: Error (2 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (37 ms)
- Electron fetch (configured): Error (18 ms): Error: net::ERR_NAME_NOT_RESOLVED
  at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
  at SimpleURLLoaderWrapper.emit (node:events:519:28)
  at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:130:17)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (124 ms): Error: getaddrinfo ENOTFOUND api.githubcopilot.com
  at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (159 ms): TypeError: fetch failed
  at node:internal/deps/undici/undici:14902:13
  at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
  at async n.\_fetch (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5104:5227)
  at async n.fetch (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5104:4539)
  at async u (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5136:186)
  at async dg.\_executeContributedCommand (file:///c:/Users/HP/AppData/Local/Programs/Microsoft%20VS%20Code/07ff9d6178/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND api.githubcopilot.com
  at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:

- DNS ipv4 Lookup: Error (2 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- DNS ipv6 Lookup: Error (2 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (24 ms)
- Electron fetch (configured): Error (27 ms): Error: net::ERR_NAME_NOT_RESOLVED
  at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
  at SimpleURLLoaderWrapper.emit (node:events:519:28)
  at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:130:17)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (47 ms): Error: getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
  at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (59 ms): TypeError: fetch failed
  at node:internal/deps/undici/undici:14902:13
  at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
  at async n.\_fetch (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5104:5227)
  at async n.fetch (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5104:4539)
  at async u (c:\Users\HP\.vscode\extensions\github.copilot-chat-0.40.1\dist\extension.js:5136:186)
  at async dg.\_executeContributedCommand (file:///c:/Users/HP/AppData/Local/Programs/Microsoft%20VS%20Code/07ff9d6178/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
  at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://mobile.events.data.microsoft.com: Error (7 ms): Error: net::ERR_NAME_NOT_RESOLVED
at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
at SimpleURLLoaderWrapper.emit (node:events:519:28)
at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:130:17)
[object Object]
{"is_request_error":true,"network_process_crashed":false}
Connecting to https://dc.services.visualstudio.com: Error (6 ms): Error: net::ERR_NAME_NOT_RESOLVED
at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
at SimpleURLLoaderWrapper.emit (node:events:519:28)
at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:130:17)
[object Object]
{"is_request_error":true,"network_process_crashed":false}
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: Error (51 ms): Error: getaddrinfo ENOTFOUND copilot-telemetry.githubusercontent.com
at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: Error (75 ms): Error: getaddrinfo ENOTFOUND copilot-telemetry.githubusercontent.com
at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
Connecting to https://default.exp-tas.com: Error (154 ms): Error: getaddrinfo ENOTFOUND default.exp-tas.com
at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Number of system certificates: 67

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).
