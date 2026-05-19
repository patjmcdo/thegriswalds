# The Griswold Family Photo Archive

Landing page at [thegriswalds.ca](https://thegriswalds.ca) — a one-page family photo upload site with a falling-frame animation that reveals a Dropbox upload button.

## Wiring the Dropbox link

Open [`lib/config.ts`](lib/config.ts) and replace the placeholder with your actual Dropbox File Request URL:

```ts
export const DROPBOX_FILE_REQUEST_URL =
  "https://www.dropbox.com/request/YOUR_ACTUAL_LINK_HERE";
```

Save the file and push to GitHub. Vercel will auto-deploy in ~30 seconds.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech

- Next.js 15 (App Router, static export)
- Tailwind CSS v4
- Framer Motion
- Deployed on Vercel
