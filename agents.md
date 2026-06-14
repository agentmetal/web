# AgentMetal

The infra provider an agent can use end-to-end: discover → pay → provision →
renew. `POST /v1/servers` → HTTP 402 listing all payment options → pay USDC
via x402 **or** a card checkout → running VPS with SSH in under 60 seconds.
No signup, no API key, no account required — any plan, either rail.

- Full agent manual: https://agentmetal.dev/llms.txt
- MCP server: `npx @agentmetal/mcp` (tools: provision_server, get_server,
  list_servers, extend_server, destroy_server, claim_account, verify_claim)
- Human docs: https://agentmetal.dev/docs/
- VMs starting at $0.70/day (2vCPU/2GB), prepaid; optional accounts add
  fleet management and monthly billing.
- Coming soon: Storage, and Agent Memory — a native-Markdown, ultra-low-cost
  persistence layer for what your agent learns.
