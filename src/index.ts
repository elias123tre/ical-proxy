import { Router } from "itty-router"
import {
  extractCourseCode,
  extractMandatory,
  extractUrl,
  filterCalendar,
  hiddenEventsPath,
  lastUpdatedPath,
} from "./util"
import ICAL from "ical.js"

export interface Env {
  CALENDAR: KVNamespace
}

const headers = {
  "content-type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
} as const

const router = Router()

// Get ical calendar file for user
router.get(
  "/social/user/:user/icalendar/:icalendar",
  async ({ params }, env: Env) => {
    const namespace = env.CALENDAR
    const hiddenEvents =
      (await namespace.get<string[]>(
        hiddenEventsPath(params.user, params.icalendar),
        "json"
      )) || []

    const comp = await filterCalendar(
      params.user,
      params.icalendar,
      (event) => {
        const url = extractUrl(event.description)
        if (url) {
          return !hiddenEvents.includes(url)
        }
        return true
      }
    )
    
    const lastUpdated = new Date().toJSON()
    await namespace.put(
      lastUpdatedPath(params.user, params.icalendar),
      lastUpdated
    )
    const resp = new Response(comp.toString(), {
      headers: {
        ...headers,
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": "attachment; filename=personal.ics",
        filename: "personal.ics",
        "cache-control": "max-age=10800, private",
      },
    })
    return resp
  }
)

// Get last updated time
router.get(
  "/social/user/:user/icalendar/:icalendar/last-updated",
  async ({ params }, env: Env) => {
    const namespace = env.CALENDAR
    const lastUpdated = await namespace.get(
      lastUpdatedPath(params.user, params.icalendar),
      "text"
    )
    return new Response(
      JSON.stringify({
        lastUpdated,
      }),
      {
        headers,
      }
    )
  }
)

// Get calendar events for a week
router.get(
  "/social/user/:user/icalendar/:icalendar/start/:start/end/:end",
  async ({ params }, env: Env) => {
    const namespace = env.CALENDAR
    const hiddenEvents =
      (await namespace.get<string[]>(
        hiddenEventsPath(params.user, params.icalendar),
        "json"
      )) || []

    const comp = await filterCalendar(params.user, params.icalendar, () => true)
    let events = comp
      .getAllSubcomponents("vevent")
      .map((e) => new ICAL.Event(e))

    const start = new Date(params.start)
    const end = new Date(params.end)
    end.setDate(end.getDate() + 1) // add one day to include events on the end date

    events = events.filter((event) => {
      const eventStart = event.startDate.toJSDate()
      const eventEnd = event.endDate.toJSDate()
      return (
        (eventStart >= start && eventStart <= end) ||
        (eventEnd >= start && eventEnd <= end)
      )
    })

    const objects = events.map((event) => {
      const url = extractUrl(event.description)
      const courseCode = extractCourseCode(event.summary)
      const mandatory = extractMandatory(event.summary)
      return {
        summary: event.summary,
        description: event.description.trim(),
        location: event.location,
        startDate: event.startDate.toJSDate().toJSON(),
        endDate: event.endDate.toJSDate().toJSON(),
        hidden: url ? hiddenEvents.includes(url) : false,
        url,
        courseCode,
        mandatory,
      }
    })

    return new Response(JSON.stringify(objects), {
      headers,
    })
  }
)

// Hide event
router.post(
  "/social/user/:user/icalendar/:icalendar/hide/:id+",
  async ({ params }, env: Env) => {
    const namespace = env.CALENDAR
    const path = hiddenEventsPath(params.user, params.icalendar)
    const id = decodeURIComponent(params.id)
    const hiddenEvents = (await namespace.get<string[]>(path, "json")) || []

    // add new id and remove duplicates with set
    const newHiddenEvents = [...new Set([...hiddenEvents, id])]
    await namespace.put(path, JSON.stringify(newHiddenEvents))

    return new Response(
      JSON.stringify({
        success: true,
        hiddenEvents: newHiddenEvents,
      }),
      {
        headers,
      }
    )
  }
)

// Show event
router.post(
  "/social/user/:user/icalendar/:icalendar/show/:id+",
  async ({ params }, env: Env) => {
    const namespace = env.CALENDAR
    const path = hiddenEventsPath(params.user, params.icalendar)
    const id = decodeURIComponent(params.id)
    const hiddenEvents = (await namespace.get<string[]>(path, "json")) || []

    // remove id
    const newHiddenEvents = hiddenEvents.filter((e) => e !== id)
    await namespace.put(path, JSON.stringify(newHiddenEvents))

    return new Response(
      JSON.stringify({
        success: true,
        hiddenEvents: newHiddenEvents,
      }),
      {
        headers,
      }
    )
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
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return router.handle(request, env, ctx)
  },
}
