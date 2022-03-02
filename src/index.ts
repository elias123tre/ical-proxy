import page from "./page"
import { html } from "./util"
import ICAL from "ical.js"
import template from "./template"

const headers = { "content-type": "text/html" }

export default {
  async fetch(
    request: Request,
    { CALENDAR }: { CALENDAR: KVNamespace }
  ): Promise<Response> {
    let rule: Rule = {
      title: "Example rule",
      type: "show",
      enabled: true,
      filters: [
        {
          property: "summary",
          regex: "Algoritmer och datastrukturer",
          negated: false,
        },
      ],
      combine: "AND",
    }
    await CALENDAR.put("rules", JSON.stringify([rule, rule]))
    let rules: Rule[] = await CALENDAR.get("rules", "json")

    const url = new URL(request.url)
    switch (url.pathname) {
      case "/calendar.ics":
        const calendar_url =
          "https://www.kth.se/social/user/285053/icalendar/c97a29275393ef6283721a8efa246741174e8f91"
        const calendar = await (await fetch(calendar_url)).text()
        let jCalData = ICAL.parse(calendar)
        const comp = new ICAL.Component(jCalData)
        comp.updatePropertyWithValue(
          "url",
          "https://ical.elias1233.workers.dev"
        )
        const events = comp
          .getAllSubcomponents("vevent")
          .map((e) => new ICAL.Event(e))
          // TODO: Proper filter from KV store
          .filter((e) => !e.summary.startsWith("Föreläsning"))
        comp.removeAllSubcomponents("vevent")
        for (const event of events) {
          comp.addSubcomponent(event.component)
        }

        return new Response(comp.toString(), {
          headers: {
            ...headers,
            "content-type": "text/calendar; charset=utf-8",
            "content-disposition": "attachment; filename=personal.ics",
            filename: "personal.ics",
            "cache-control": "max-age=10800, private",
          },
        })

      default:
        return new Response(page(rules), { headers })
    }
  },
}
