# Ticketmaster CLI - Agent Instructions

This CLI provides access to the Ticketmaster Commerce API for event ticketing data.

## Common Tasks

**Get event offers:**
```bash
ticketmaster events offers G5vHZ9gMdcfPa
```

**Get event offers with JSON output:**
```bash
ticketmaster events offers G5vHZ9gMdcfPa --json
```

**Set API key:**
```bash
ticketmaster config set --api-key YOUR_API_KEY
```

**Show current configuration:**
```bash
ticketmaster config show
```

**Show API information:**
```bash
ticketmaster info
```

## Output Modes

- Default: Human-readable formatted output with offer details
- `--json`: Machine-readable JSON output

## Important Notes

- Requires API key (X-SSL-CERT-UID) - obtain from Ticketmaster Developer Portal
- Commerce API v2 only supports event offers lookup
- For event search/discovery, use the Discovery API instead
- Transaction capabilities (cart, payment, purchase) require approved access

## API Reference

- Documentation: http://developer.ticketmaster.com/
- Developer Portal: http://developer.ticketmaster.com/support/contact-us/
- Base URL: https://www.ticketmaster.com/commerce/v2

## Event ID Format

Event IDs are unique identifiers provided by Ticketmaster (e.g., G5vHZ9gMdcfPa).
To find event IDs, use the Discovery API or Ticketmaster's event search tools.
