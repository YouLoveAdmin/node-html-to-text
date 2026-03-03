# Azure Static Web Apps sub-project

This folder is a deployable sub-project for Azure Static Web Apps (SWA).

## Folder layout

- `app/`: static frontend
- `api/`: Azure Functions backend with `/api/convert`

## Azure Wizard settings

When connecting this repo in the Azure Static Web Apps wizard, use:

- **App location**: `apps/swa-html-to-text/app`
- **Api location**: `apps/swa-html-to-text/api`
- **Output location**: *(leave empty)*

## API usage

Endpoint: `POST /api/convert`

Body:

```json
{
  "html": "<h1>Hello</h1><p>world</p>"
}
```

Response:

```json
{
  "text": "HELLO\n\nworld"
}
```

## Notes

- The API depends on the published `html-to-text` package (`^9.0.5`).
- This sub-project is intentionally isolated from the monorepo workspaces to keep SWA deployment simple.