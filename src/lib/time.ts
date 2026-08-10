/**
 * Format a Date as a timezone-naive `YYYY-MM-DDTHH:mm:ss` string in the given
 * IANA zone — the shape the OpenElectricity API expects for dateStart/dateEnd
 * (network-local time, no offset suffix).
 */
export function naiveLocalTime(date: Date, timeZone: string): string {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-CA', {
			timeZone,
			hourCycle: 'h23',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
			.formatToParts(date)
			.map((part) => [part.type, part.value])
	);
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/** NEM market time is UTC+10 year-round; Brisbane observes no DST. */
export const NEM_TIMEZONE = 'Australia/Brisbane';
