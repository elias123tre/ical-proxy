# KTH Calendar proxy

> A proxy to hide events from the KTH calendar

## Usage

Take your KTH calendar URL and replace the hostname with the hostname of your deployed Cloudflare worker.

## Example

> Example assumes the worker is deployed to `https://calendar.elias1233.workers.dev`
>
> The event url is gotten from the description of the event. Every event in the KTH calendar has a link to the event in the description.

- KTH URL: `https://www.kth.se/social/user/123456/icalendar/123456789abcdef123456789abcdef1234567890`

- Proxy URL: `https://calendar.elias1233.workers.dev/social/user/123456/icalendar/123456789abcdef123456789abcdef1234567890`

- Get events between dates: `https://calendar.elias1233.workers.dev/social/user/123456/icalendar/123456789abcdef123456789abcdef1234567890/start/2023-05-08/end/2023-05-15`

- Hide an event by URL: `https://calendar.elias1233.workers.dev/social/user/123456/icalendar/123456789abcdef123456789abcdef1234567890/hide/https%3A%2F%2Fwww.kth.se%2Fsocial%2Fuser%2F123456%2Fevent%2F123456789abcdef123456789abcdef1234567890`

- Show an event by URL: `https://calendar.elias1233.workers.dev/social/user/123456/icalendar/123456789abcdef123456789abcdef1234567890/hide/https%3A%2F%2Fwww.kth.se%2Fsocial%2Fuser%2F123456%2Fevent%2F123456789abcdef123456789abcdef1234567890`
