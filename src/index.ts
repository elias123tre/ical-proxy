import ICAL from "ical.js"
import { Router, IHTTPMethods, Request } from "itty-router"

import { filterFromRules, handleOptions, isHideShowRule, isRule } from "./util"

const headers = {
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
}
const router = Router<ExtendedRequest, IHTTPMethods>()

export type ExtendedRequest = Request & {
  getHideShowRules: () => Promise<HideShowRule[]>
  setHideShowRules: (newRules: HideShowRule[]) => Promise<void>
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
    req.getHideShowRules = async () => {
      const rules: HideShowRule[] = await namespace.get(
        `${user}/${icalendar}/hideshowrules`,
        "json"
      )
      return (rules || []).map((rule, idx) => ({ ...rule, id: idx }))
    }
    req.setHideShowRules = async (newRules) =>
      namespace.put(
        `${user}/${icalendar}/hideshowrules`,
        JSON.stringify(newRules, null, 2)
      )
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

// Get url rules
router.get(
  "/social/user/:user/icalendar/:icalendar/hideshowrules",
  async ({ getHideShowRules }: ExtendedRequest) => {
    const rules = await getHideShowRules()
    return new Response(JSON.stringify(rules, null, 2), {
      headers,
    })
  }
)

// Update url rule
router.put(
  "/social/user/:user/icalendar/:icalendar/hideshowrule",
  async ({
    parseBody,
    ParseError,
    getHideShowRules,
    setHideShowRules,
  }: ExtendedRequest) => {
    // parse json body
    const updateRule: HideShowRule = await parseBody()
    if (!isHideShowRule(updateRule)) {
      return ParseError
    }
    const rules = await getHideShowRules()
    const newRules = rules.map((rule) =>
      rule.id == updateRule.id ? updateRule : rule
    )
    await setHideShowRules(newRules)
    return new Response(JSON.stringify(newRules || [], null, 2), {
      headers,
    })
  }
)

// Add new url rule
router.post(
  "/social/user/:user/icalendar/:icalendar/hideshowrule",
  async ({
    parseBody,
    ParseError,
    getHideShowRules,
    setHideShowRules,
  }: ExtendedRequest) => {
    // parse json body
    const newRule: HideShowRule = await parseBody()
    if (!isHideShowRule(newRule)) {
      return ParseError
    }
    const rules = await getHideShowRules()
    const newRules = [...rules, newRule]
    await setHideShowRules(newRules)
    return new Response(JSON.stringify(newRules, null, 2), {
      headers,
    })
  }
)

// Delete url rule
router.delete(
  "/social/user/:user/icalendar/:icalendar/hideshowrule/:id",
  async ({ getHideShowRules, setHideShowRules, params }: ExtendedRequest) => {
    const deleteId: number = parseInt(params.id, 10)
    const rules = await getHideShowRules()
    const newRules = rules
      .filter((rule) => rule.id != deleteId)
      // recalculate index
      .map((rule, idx) => ({ ...rule, id: idx }))
    await setHideShowRules(newRules)
    return new Response(JSON.stringify(newRules, null, 2), {
      headers,
    })
  }
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
    // parse json body
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
    // parse json body
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
  "/social/user/:user/icalendar/:icalendar/rule/:id",
  async ({ getRules, setRules, params }: ExtendedRequest) => {
    const deleteId: number = parseInt(params.id, 10)
    const rules = await getRules()
    const newRules = rules
      .filter((rule) => rule.id != deleteId)
      // recalculate index
      .map((rule, idx) => ({ ...rule, id: idx }))
    await setRules(newRules)
    return new Response(JSON.stringify(newRules, null, 2), {
      headers,
    })
  }
)

// Get preview of events
router.get(
  "/social/user/:user/icalendar/:icalendar/preview",
  async ({ getRules, getHideShowRules, url }: ExtendedRequest) => {
    const comp = await filterFromRules(
      getRules,
      getHideShowRules,
      url.replace(/\/preview$/, "")
    )
    let events = comp
      .getAllSubcomponents("vevent")
      .map((e) => new ICAL.Event(e))
    let weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    let weekAhead = new Date()
    weekAhead.setDate(weekAhead.getDate() + 7)
    // filter to show events from past, current, next week
    let filtered = events.filter((event) => {
      let dt = event.startDate.toJSDate()
      return weekAgo < dt && dt < weekAhead
    })
    filtered.sort((a, b) => a.startDate.toUnixTime() - b.startDate.toUnixTime())

    const objects = filtered.map((e) => ({
      summary: e.summary,
      description: e.description,
      location: e.location,
      startDate: e.startDate.toJSDate().toJSON(),
      endDate: e.endDate.toJSDate().toJSON(),
      url:
        e.description
          .match(
            /\bhttps?:\/\/(?:www\.)?kth.se\/social\/([\w-]+\/)+event\/[\w-]+\/?\b/g
          )
          .slice(-1)[0] || null,
    }))

    return new Response(JSON.stringify(objects, null, 2), {
      headers,
    })
  }
)

// Get ical calendar file for user
router.get(
  "/social/user/:user/icalendar/:icalendar",
  async ({ getRules, getHideShowRules, url }: ExtendedRequest) => {
    const comp = await filterFromRules(getRules, getHideShowRules, url)

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

const errorHandler = (error: Error & { status?: any }) => {
  console.error(error, error.name, error.message, error.status)
  return new Response(error.message || "Server Error", {
    status: error.status || 500,
  })
}

export default {
  fetch: (req: ExtendedRequest, ...args: any) =>
    router.handle(req, ...args).catch(errorHandler),
}
