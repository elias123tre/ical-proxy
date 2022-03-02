import { html } from "./util"
import template, { DESCRIPTION, TITLE } from "./template"

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

const page = (rules: Rule[]) =>
  template(html`
    <header>
      <h1>${TITLE}</h1>
      <p>${DESCRIPTION}</p>
      <p>
        You can export your schedule on the page for
        <a href="https://www.kth.se/social/home/calendar/settings/"
          >KTH calendar settings</a
        >.
      </p>
      <p><a href="/calendar.ics">Download the ICS file</a></p>
    </header>
    <h1>Rules</h1>
    <div class="flex flex-col gap-2 divide-y-2 not-prose">
      ${rules.map((rule) => renderRule(rule)).join("")}
    </div>
    <div></div>
  `)

export default page
