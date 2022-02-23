/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const headers = { "content-type": "text/html" }

const html = (s: TemplateStringsArray, ...args: any[]) => {
  return s.map((ss, i) => `${ss}${args?.[i] ?? ""}`).join("")
}

const page = html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>Page Title</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" type="text/css" media="screen" href="main.css" />
    </head>
    <body>
      <div class="">Lorem ipsum ${JSON.stringify([{ test: 123 }, {}])}</div>
    </body>
  </html>
`

export default {
  async fetch(request: Request): Promise<Response> {
    console.log(CALENDAR.list())
    return new Response(page, { headers })
  },
}
