const html = (s: TemplateStringsArray, ...args: any[]) => {
  return s.map((ss, i) => `${ss}${args?.[i] ?? ""}`).join("")
}

const TITLE = "KTH Calendar proxy"
const DESCRIPTION = html`This service is a proxy for your KTH exported calendar
that can hide or show certain events based on rules using regular expressions on
the title, description, location or KTH event link/id.`

const renderRule = (rule: Rule) => html`<div class="py-2">
  <div class="flex justify-between items-baseline gap-2">
    <div class="text-lg font-semibold">${rule.title}</div>
    <div class="text-sm">${rule.enabled ? "enabled" : "disabled"}</div>
  </div>
  <div class="text-slate-600 text-sm">Action:</div>
  <div class="leading-none">${rule.type}</div>
  ${rule.filters
    .map(
      (filter) => html`<div>
        <div>${filter.property}</div>
        <input type="text" value="${filter.regex}" />
      </div>`
    )
    .join("")}
</div>`

const page = (rules: Rule[]) => html`
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
      <header>
        <h1>${TITLE}</h1>
        <p>${DESCRIPTION}</p>
        <p>
          You can export your schedule on the page for
          <a href="https://www.kth.se/social/home/calendar/settings/"
            >KTH calendar settings</a
          >.
        </p>
      </header>
      <h1>Rules</h1>
      <div class="flex flex-col gap-2 divide-y-2 not-prose">
        ${rules.map((rule) => renderRule(rule)).join("")}
      </div>
      <div></div>
    </body>
  </html>
`

export default page
