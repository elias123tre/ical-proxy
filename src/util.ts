import ICAL, { Component } from "ical.js"

const html = (s: TemplateStringsArray, ...args: any[]) => {
  return s.map((ss, i) => `${ss}${args?.[i] ?? ""}`).join("")
}

/**
 * Filter the ical file from KTH with a predicate
 * @param url KTH export calendar url
 * @param predicate return true for the calendar items that should be kept
 * @returns promise of root calendar component
 */
const filter_calendar = async (
  url: string,
  predicate: (value: ICAL.Event, index: number, array: ICAL.Event[]) => boolean
): Promise<Component> => {
  const calendar = await (await fetch(url)).text()
  const jCalData = ICAL.parse(calendar)
  const comp = new ICAL.Component(jCalData)
  comp.updatePropertyWithValue("url", "https://ical.elias1233.workers.dev")
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

export { html, filter_calendar }
