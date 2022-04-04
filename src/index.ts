import ICAL from "ical.js"
import itty, { IHTTPMethods, Request } from "itty-router"

import { filterFromRules, handleOptions, isHideShowRule, isRule } from "./util"

const headers = {
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
}
const router = itty.Router<ExtendedRequest, IHTTPMethods>()

export type ExtendedRequest = Request & {
  registerHit: () => Promise<void>
  getHits: () => Promise<{ hits: number; latestHit: Date }>
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
    const namespace: KVNamespace = env.CALENDAR
    const { user, icalendar } = req.params
    const basePath = `${user}/${icalendar}`
    req.registerHit = async () => {
      const { hits } = await req.getHits()
      await namespace.put(`${basePath}/hits`, `${hits + 1}`)
      await namespace.put(`${basePath}/hits/latest`, new Date().toJSON())
    }
    req.getHits = async () => {
      const strHits = await namespace.get(`${basePath}/hits`)
      const strLatest = await namespace.get(`${basePath}/hits/latest`)
      return {
        hits: parseInt(strHits, 10) || 0,
        latestHit: strLatest ? new Date(strLatest) : null,
      }
    }
    req.getHideShowRules = async () => {
      const rules: HideShowRule[] = await namespace.get(
        `${basePath}/hideshowrules`,
        "json"
      )
      return (rules || []).map((rule, idx) => ({ ...rule, id: idx }))
    }
    req.setHideShowRules = async (newRules) =>
      namespace.put(
        `${basePath}/hideshowrules`,
        JSON.stringify(newRules, null, 2)
      )
    req.getRules = async () => {
      const rules: Rule[] = await namespace.get(`${basePath}`, "json")
      return (rules || []).map((rule, idx) => ({ ...rule, id: idx }))
    }
    req.setRules = (newRules: Rule[]) =>
      namespace.put(`${basePath}`, JSON.stringify(newRules, null, 2))
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

// Get hits for proxied url
router.get(
  "/social/user/:user/icalendar/:icalendar/hits",
  async ({ getHits }: ExtendedRequest) => {
    const hits = await getHits()
    return new Response(JSON.stringify(hits, null, 2), {
      headers,
    })
  }
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
    events.sort((a, b) => a.startDate.toUnixTime() - b.startDate.toUnixTime())

    const objects = events.map((e) => ({
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
  async ({ registerHit, getRules, getHideShowRules, url }: ExtendedRequest) => {
    const comp = await filterFromRules(getRules, getHideShowRules, url)

    const resp = new Response(comp.toString(), {
      headers: {
        ...headers,
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": "attachment; filename=personal.ics",
        filename: "personal.ics",
        "cache-control": "max-age=10800, private",
      },
    })
    await registerHit()
    return resp
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
  fetch: (
    req: ExtendedRequest,
    requestInitr?: globalThis.Request | RequestInit,
    ...args: any
  ) => router.handle(req, requestInitr, ...args).catch(errorHandler),
}
