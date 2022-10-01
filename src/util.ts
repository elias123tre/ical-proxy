import ICAL, { Component } from "ical.js"
import { ExtendedRequest } from "."

let colors = [
  "darkkhaki",
  "lightpink",
  "springgreen",
  "firebrick",
  "yellow",
  "chocolate",
  "darkblue",
  "orchid",
  "royalblue",
  "peru",
  "violet",
  "olive",
  "goldenrod",
  "black",
  "brown",
  "white",
  "lime",
  "palevioletred",
  "thistle",
  "peachpuff",
  "hotpink",
  "seagreen",
  "antiquewhite",
  "gainsboro",
  "slateblue",
]
let courseColors: { [key: string]: string } = {}

export function colorFromCourseCode(courseCode: string) {
  const color = courseColors[courseCode]
  if (color) {
    return color
  }
  const newColor = colors.shift()
  if (!newColor) {
    return "gray"
  }
  courseColors[courseCode] = newColor
  return newColor
}

export async function filterFromRules(
  getRules: ExtendedRequest["getRules"],
  getHideShowRules: ExtendedRequest["getHideShowRules"],
  url: string
) {
  const eventInRuleList = (event: ICAL.Event, list: HideShowRule[]) =>
    list.some((rule) => event["description"].includes(rule.url))

  const rules = await getRules()
  const urlrules = (await getHideShowRules()).filter((rule) => rule.url) // filter not empty urls
  const showrules = urlrules.filter((rule) => rule.type == "show")
  const hiderules = urlrules.filter((rule) => rule.type == "hide")

  const comp = await filterCalendar(
    new URL(url).pathname.replace(/^\//, ""),
    (event) => {
      if (eventInRuleList(event, showrules)) {
        return true
      } else if (eventInRuleList(event, hiderules)) {
        return false
      } else {
        return filterEvent(rules, event)
      }
    }
  )
  return comp
}

export function isRule(rule: any): rule is Rule {
  if (rule && typeof rule === "object") {
    if (Object.keys(rule).length > 0) {
      return true
    }
  }
  return false
}

export function isHideShowRule(rule: any): rule is HideShowRule {
  if (rule && typeof rule === "object") {
    if (Object.keys(rule).length > 0) {
      return true
    }
  }
  return false
}

// return true -> event should be included
export function filterEvent(rules: Rule[], event: ICAL.Event) {
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

  let firstMatched: Rule
  const anyRuleMatches = rules
    // if any rule matches
    .some((rule) => {
      const testFilter = (filter: Filter) => {
        // if matches filter regex rule
        let matches = RegExp(filter.regex).test(event[filter.property])
        return filter.negated ? !matches : matches
      }

      const isMatched =
        rule.combine == "AND"
          ? rule.filters.every(testFilter)
          : rule.filters.some(testFilter)

      if (isMatched) {
        firstMatched = rule
        return true
      }
      // default: no match (keep event)
      return false
    })
  if (anyRuleMatches) {
    if (firstMatched.type == "show") {
      // should force-keep filter matches
      return true
    } else if (firstMatched.type == "hide") {
      // should filter out filter matches
      return false
    }
  }
  // include by default (if no filter matches)
  return true
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
    // Set event color from course code
    let courseCode =
      event.summary
        // Extract course code from last occuring parenthesis
        ?.match(/\(((?:\w{2}\d{4})|(?:[\w\d]{2,}[ ,\wåäöÅÄÖ\d]*))\)/gi)
        ?.pop()
        ?.replace(/[\(\)]/g, "") || null
    event.component.addPropertyWithValue(
      "COLOR",
      colorFromCourseCode(courseCode)
    )

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
        Allow: "GET, PUT, POST, DELETE, HEAD, OPTIONS",
      },
    })
  }
}
