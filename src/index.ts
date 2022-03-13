import { Router, IHTTPMethods, Request } from "itty-router"

import { filterCalendar, filterEvent, handleOptions, isRule } from "./util"

const headers = {
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,HEAD,OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
}
const router = Router<ExtendedRequest, IHTTPMethods>()

type ExtendedRequest = Request & {
  getRules: () => Promise<Rule[]>
  setRules: (newRules: Rule[]) => Promise<void>
  parseBody: () => Promise<any>
  ParseError: Response
}

// Inject helpers on all routes
router.all(
  "/social/user/:user/icalendar/:icalendar*",
  (req: ExtendedRequest, env) => {
    const namespace = env.CALENDAR
    const { user, icalendar } = req.params
    req.getRules = async () => {
      const rules: Rule[] = await namespace.get(`${user}/${icalendar}`, "json")
      return (rules || []).map((rule, idx) => ({ ...rule, id: idx }))
    }
    req.setRules = (newRules: Rule[]) =>
      namespace.put(`${user}/${icalendar}`, JSON.stringify(newRules, null, 2))
    req.parseBody = async () => JSON.parse((await req.text()).trim())
    req.ParseError = new Response(
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

router.options("/social/user/:user/icalendar/:icalendar*", (request) =>
  handleOptions(request, headers)
)

// Get rules
router.get(
  "/social/user/:user/icalendar/:icalendar/rules",
  async ({ getRules }: ExtendedRequest) => {
    const rules = await getRules()
    return new Response(JSON.stringify(rules, null, 2), {
      headers,
    })
  }
)

// Update rule
router.put(
  "/social/user/:user/icalendar/:icalendar/rule",
  async ({ parseBody, ParseError, getRules, setRules }: ExtendedRequest) => {
    // parse body
    const updateRule: Rule = await parseBody()
    if (!isRule(updateRule)) {
      return ParseError
    }
    const rules = await getRules()
    const newRules = rules.map((rule) =>
      rule.id == updateRule.id ? updateRule : rule
    )
    await setRules(newRules)
    return new Response(JSON.stringify(newRules || [], null, 2), {
      headers,
    })
  }
)

// Add new rule
router.post(
  "/social/user/:user/icalendar/:icalendar/rule",
  async ({ parseBody, ParseError, getRules, setRules }: ExtendedRequest) => {
    // parse body
    const newRule: Rule = await parseBody()
    if (!isRule(newRule)) {
      return ParseError
    }
    const rules = await getRules()
    const newRules = [...rules, newRule]
    await setRules(newRules)
    return new Response(JSON.stringify(newRules, null, 2), {
      headers,
    })
  }
)

// Delete rule
router.delete(
  "/social/user/:user/icalendar/:icalendar/rule",
  async ({ parseBody, ParseError, getRules, setRules }: ExtendedRequest) => {
    // parse body
    const deleteRule: Rule = await parseBody()
    if (!isRule(deleteRule)) {
      return ParseError
    }
    const rules = await getRules()
    const newRules = rules.filter((rule) => rule.id != deleteRule.id)
    await setRules(newRules)
    return new Response(JSON.stringify(newRules, null, 2), {
      headers,
    })
  }
)

// Get ical calendar file for user
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

// 404 page on invalid requests
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
