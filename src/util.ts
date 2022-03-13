import ICAL, { Component } from "ical.js"

export function isRule(rule: any): rule is Rule {
  if (rule && typeof rule === "object") {
    if (Object.keys(rule).length > 0) {
      return true
    }
  }
  return false
}

export function filterEvent(rules: Rule[], event: ICAL.Event) {
  // return true -> event
  return !rules
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
}

/**
 * Filter the ical file from KTH with a predicate
 * @param path KTH export calendar url
 * @param predicate return true for the calendar items that should be kept
 * @returns promise of root calendar component
 */
export async function filterCalendar(
  path: string,
  predicate: (value: ICAL.Event, index: number, array: ICAL.Event[]) => boolean
): Promise<Component> {
  const url = `https://kth.se/${path}`
  const calendar = await (await fetch(url)).text()
  const jCalData = ICAL.parse(calendar)
  const comp = new ICAL.Component(jCalData)
  comp.updatePropertyWithValue(
    "url",
    `https://ical.elias1233.workers.dev/${path}`
  )
  const events = comp
    .getAllSubcomponents("vevent")
    .map((e) => new ICAL.Event(e))
    .filter(predicate)
  comp.removeAllSubcomponents("vevent")
  for (const event of events) {
    comp.addSubcomponent(event.component)
  }
  return comp
}

export function handleOptions(request: any, corsHeaders: any) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check or reject the requested method + headers
    // you can do that here.
    let respHeaders = {
      ...corsHeaders,
      // Allow all future content Request headers to go back to browser
      // such as Authorization (Bearer) or X-Client-Name-Version
      "Access-Control-Allow-Headers": request.headers.get(
        "Access-Control-Request-Headers"
      ),
    }

    return new Response(null, {
      headers: respHeaders,
    })
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        ...corsHeaders,
        Allow: "GET,PUT,POST,DELETE,HEAD,OPTIONS",
      },
    })
  }
}
