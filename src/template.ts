import { html } from "./util"

const TITLE = "KTH Calendar proxy"
const DESCRIPTION = html`This service is a proxy for your KTH exported calendar
that can hide or show certain events based on rules using regular expressions on
the title, description, location or KTH event link/id.`

const template = (content: any) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>${TITLE}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
    </head>
    <body class="container mx-auto prose mt-4 shadow-lg rounded-lg p-2">
      ${content}
    </body>
  </html>
`
export { TITLE, DESCRIPTION }
export default template
