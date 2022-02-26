import page from "./page"

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
        return new Response("calendar", {
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
