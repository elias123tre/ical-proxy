import { Router } from "itty-router"

import { filter_calendar } from "./util"
import preview from "./preview"
import homepage from "./homepage"

const headers = { "content-type": "text/html" }
const router = Router()

router.get("/", async (req, { CALENDAR }: { CALENDAR: KVNamespace }) => {
  let rules: Rule[] = await CALENDAR.get("rules", "json")
  return new Response(homepage(rules), { headers })
})

router.get("/preview", async (req) => new Response(preview(), { headers }))

router.get(
  "/calendar.ics",
  async (req, { CALENDAR }: { CALENDAR: KVNamespace }) => {
    let rules: Rule[] = await CALENDAR.get("rules", "json")
    // filter to only enabled rules
    rules = rules.filter((rule) => rule.enabled)
    // sort such that show rules are handled first
    rules.sort((a, b) => {
      if (a.type == b.type) {
        return 0
      }
      // show should come first
      if (a.type == "show" && b.type == "hide") {
        return -1
      }
      // hide should come last
      if (a.type == "hide" && b.type == "show") {
        return 1
      }
    })
    console.log(JSON.stringify(rules, null, 2))

    const comp = await filter_calendar(
      "https://www.kth.se/social/user/285053/icalendar/c97a29275393ef6283721a8efa246741174e8f91",
      // TODO: Proper filter from KV store
      (event) =>
        // whether to keep event or not: if rule is not matched
        !rules
          // if any rule matches
          .some((rule) => {
            // if all filters match
            let allMatches = rule.filters.every((filter) => {
              // if matches filter regex rule
              let matches = RegExp(filter.regex).test(event[filter.property])
              return filter.negated ? !matches : matches
            })

            if (rule.type == "show") {
              // should force-keep filter matches ->
            } else if (rule.type == "hide") {
              // should filter out filter matches
            }
            // default: no match (keep event)
            return false
          })
    )

    return new Response(comp.toString(), {
      headers: {
        ...headers,
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": "attachment; filename=personal.ics",
        filename: "personal.ics",
        "cache-control": "max-age=10800, private",
      },
    })
  }
)

router.post(
  "/update/:id",
  async (req, { CALENDAR }: { CALENDAR: KVNamespace }) => {
    await CALENDAR.put("rules", JSON.stringify([]))
    return new Response("updated!", { headers })
  }
)

router.all("*", () => new Response("Not Found.", { status: 404, headers }))

export default {
  fetch: router.handle,
}
