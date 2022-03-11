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
