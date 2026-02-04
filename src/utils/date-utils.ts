export function formatDate(date: Date, format: string): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return format
		.replace('YYYY', String(year))
		.replace('MM', month)
		.replace('DD', day);
}

export function parseDate(dateStr: string): Date | null {
	// Parse YYYY-MM-DD format
	const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) {
		return null;
	}

	const year = match[1];
	const month = match[2];
	const day = match[3];

	if (!year || !month || !day) {
		return null;
	}

	const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

	// Validate the date is valid
	if (isNaN(date.getTime())) {
		return null;
	}

	return date;
}

export function getPreviousDay(date: Date): Date {
	const prev = new Date(date);
	prev.setDate(prev.getDate() - 1);
	return prev;
}

export function getToday(): Date {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return today;
}

export function getTodayStart(): number {
	return getToday().getTime();
}

export function isToday(date: Date): boolean {
	const today = new Date();
	return date.toDateString() === today.toDateString();
}

export function isSameDay(date1: Date, date2: Date): boolean {
	return date1.toDateString() === date2.toDateString();
}

export function getDailyNotePath(date: Date, folder: string): string {
	const dateStr = formatDate(date, 'YYYY-MM-DD');
	if (folder && folder.length > 0) {
		return `${folder}/${dateStr}.md`;
	}
	return `${dateStr}.md`;
}

export function extractDateFromFilename(filename: string): Date | null {
	// Remove .md extension if present
	const basename = filename.replace(/\.md$/, '');
	return parseDate(basename);
}
