import ICAL, { Component } from "ical.js"

export function extractUrl(description: string) {
  const match = description.match(
    /\bhttps?:\/\/(www\.)?kth.se\/social\/([\w-]+\/)+event\/[\w-]+\/?\b/g
  )
  return match?.[match.length - 1] || null
}

export function extractCourseCode(summary: string) {
  // Extract course code from last occuring parenthesis
  const match = summary.match(
    /\(((?:\w{2}\d{4})|(?:[\w\d]{2,}[ ,\wåäöÅÄÖ\d]*))\)/gi
  )
  return match?.[match.length - 1]?.replace(/[\(\)]/g, "") || null
}

export function extractMandatory(summary: string) {
  return new RegExp(/^\s*\*\s*/).test(summary)
}

export function hiddenEventsPath(user: string, icalendar: string) {
  return `${user}/${icalendar}/hidden`
}

// path for the last date the calendar was refreshed
export function lastUpdatedPath(user: string, icalendar: string) {
  return `${user}/${icalendar}/lastUpdated`
}

/**
 * Filter the ical file from KTH with a predicate
 * @param user kth username (part of )
 * @param icalendar icalendar name
 * @param predicate return true for the calendar items that should be kept
 * @returns promise of root calendar component
 */
export async function filterCalendar(
  user: string,
  icalendar: string,
  predicate: (value: ICAL.Event, index: number, array: ICAL.Event[]) => boolean
): Promise<Component> {
  const path = `social/user/${user}/icalendar/${icalendar}`
  const url = `https://kth.se/${path}`
  const calendar = await (await fetch(url)).text()
  const jCalData = ICAL.parse(calendar)
  const comp = new ICAL.Component(jCalData)
  comp.updatePropertyWithValue(
    "url",
    `https://kth-ical.elias1233.workers.dev/${path}`
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
