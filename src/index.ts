import { Router } from "itty-router"

import { filterCalendar, filterEvent, isRule } from "./util"

const headers = {
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
}
const router = Router()

router.get(
  "/social/user/:user/icalendar/:icalendar",
  async (
    { params: { user, icalendar }, url },
    { CALENDAR }: { CALENDAR: KVNamespace }
  ) => {
    let rules: Rule[] =
      (await CALENDAR.get(`${user}/${icalendar}`, "json")) || []

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

    const comp = await filterCalendar(
      `social/user/${user}/icalendar/${icalendar}`,
      (event) => filterEvent(rules, event)
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

router.get(
  "/social/user/:user/icalendar/:icalendar/rules",
  async (
    { params: { user, icalendar } },
    { CALENDAR }: { CALENDAR: KVNamespace }
  ) => {
    let rules: Rule[] = await CALENDAR.get(`${user}/${icalendar}`, "json")
    return new Response(JSON.stringify(rules || [], null, 2), { headers })
  }
)

router.post(
  "/social/user/:user/icalendar/:icalendar/rules",
  async (req, { CALENDAR }: { CALENDAR: KVNamespace }) => {
    const {
      params: { user, icalendar },
    } = req
    try {
      const content: string = await req.text()
      const rules: Rule[] = JSON.parse(content.trim())
      if (rules.every((rule) => isRule(rule))) {
        await CALENDAR.put(
          `${user}/${icalendar}`,
          JSON.stringify(rules, null, 2)
        )
        return new Response("", { headers })
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(error)
      } else {
        throw error
      }
    }
    return new Response(
      JSON.stringify({
        error: "Passed json does not match format for Rule",
      }),
      {
        status: 400,
        headers,
      }
    )
  }
)

router.get(
  "/calendar.ics",
  async (req, { CALENDAR }: { CALENDAR: KVNamespace }) => {}
)

router.all(
  "*",
  () =>
    new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers,
    })
)

export default {
  fetch: router.handle,
}
