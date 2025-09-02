export class CalendarUtils {
  private static ICS_URI = 'data:text/calendar;charset=utf-8,';

  static buildCalendarEvent(
    {
      description = '',
      duration,
      endDateTime,
      location,
      startDateTime,
      timeZone,
      title,
      webBaseUrl,
    }: CalendarEventProperties,
    type: CalendarTypes,
  ): string {
    const encodeURI =
      type !== CalendarTypes.Ical && type !== CalendarTypes.Outlook;

    const data = {
      description: encodeURI ? encodeURIComponent(description) : description,
      duration,
      endDateTime: this.removeDateTZ(endDateTime),
      location: encodeURI ? encodeURIComponent(location) : location,
      startDateTime: this.removeDateTZ(startDateTime),
      timeZone,
      title: encodeURI ? encodeURIComponent(title) : title,
      webBaseUrl,
    };

    switch (type) {
      case CalendarTypes.Google:
        return this.googleCalendarUrl(data);
      case CalendarTypes.Yahoo:
        return this.yahooCalendarUrl(data);
      default:
        return this.calendarEvent(data);
    }
  }

  /**
   * Takes an event object and returns a Google Calendar Event URL
   */
  static googleCalendarUrl({
    description = '',
    endDateTime,
    location,
    startDateTime,
    timeZone,
    title,
  }: CalendarEventProperties): string {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${startDateTime}/${endDateTime}${
      timeZone && `&ctz=${timeZone}`
    }&location=${location}&text=${title}&details=${description}`;
  }

  /**
   * Takes an event object and returns a Yahoo Calendar Event URL
   */
  static yahooCalendarUrl({
    description = '',
    duration,
    location,
    startDateTime,
    title,
  }: CalendarEventProperties): string {
    return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startDateTime}&dur=${duration}&desc=${description}&in_loc=${location}`;
  }

  static calendarEvent({
    description = '',
    endDateTime,
    location,
    startDateTime,
    timeZone,
    title,
    webBaseUrl,
  }: CalendarEventProperties): string {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `URL:${webBaseUrl}`,
      'METHOD:PUBLISH',
      timeZone
        ? `DTSTART;TZID=${timeZone}:${startDateTime}`
        : `DTSTART:${startDateTime}`,
      timeZone
        ? `DTEND;TZID=${timeZone}:${endDateTime}`
        : `DTEND:${endDateTime}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${this.escapeICSDescription(description)}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
  }

  static escapeICSDescription(description?: string): string {
    return description ? description.replace(/(\r?\n|<br ?\/?>)/g, '\\n') : '';
  }

  static removeDateTZ(date: string): string {
    return date.replace('+00:00', 'Z');
  }

  static calendarEventToBuffer(event: string): Buffer {
    return Buffer.from(decodeURI(event.replace(this.ICS_URI, '')));
  }

  static calendarEventToUrl(event: string): string {
    return encodeURI(`${this.ICS_URI}${event}`);
  }
}

export enum CalendarTypes {
  Google = 'Google',
  Ical = 'iCal',
  Outlook = 'Outlook',
  Yahoo = 'Yahoo',
}

export interface CalendarEventProperties {
  description?: string;
  duration: number;
  endDateTime: string;
  location: string;
  startDateTime: string;
  timeZone?: string;
  title: string;
  webBaseUrl: string;
}
