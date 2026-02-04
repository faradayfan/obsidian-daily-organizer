export interface SectionLocation {
	start: number;
	end: number;
	contentStart: number;
}

export function findSectionByTag(content: string, tag: string): SectionLocation | null {
	const lines = content.split('\n');
	let sectionStart = -1;
	let contentStart = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		// Look for a line containing the tag (could be header or standalone)
		if (line.includes(tag)) {
			sectionStart = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
			contentStart = sectionStart + line.length + 1;

			// Find end of section (next header of same or higher level, or end of file)
			const headerMatch = line.match(/^(#{1,6})\s/);
			const headerLevel = headerMatch?.[1]?.length ?? 0;

			for (let j = i + 1; j < lines.length; j++) {
				const nextLine = lines[j];
				if (!nextLine) continue;

				const nextHeaderMatch = nextLine.match(/^(#{1,6})\s/);
				const nextHeaderLevel = nextHeaderMatch?.[1]?.length ?? 0;

				if (nextHeaderMatch && nextHeaderLevel <= headerLevel) {
					const sectionEnd = lines.slice(0, j).join('\n').length;
					return { start: sectionStart, end: sectionEnd, contentStart };
				}
			}

			// Section goes to end of file
			return { start: sectionStart, end: content.length, contentStart };
		}
	}

	return null;
}

export function findSectionByHeader(content: string, header: string): SectionLocation | null {
	const lines = content.split('\n');
	const normalizedHeader = header.trim().toLowerCase();

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		const trimmedLine = line.trim().toLowerCase();

		if (trimmedLine === normalizedHeader || trimmedLine.startsWith(normalizedHeader + ' ')) {
			const sectionStart = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
			const contentStart = sectionStart + line.length + 1;

			// Determine header level
			const headerMatch = line.match(/^(#{1,6})\s/);
			const headerLevel = headerMatch?.[1]?.length ?? 0;

			// Find end of section
			for (let j = i + 1; j < lines.length; j++) {
				const nextLine = lines[j];
				if (!nextLine) continue;

				const nextHeaderMatch = nextLine.match(/^(#{1,6})\s/);
				const nextHeaderLevel = nextHeaderMatch?.[1]?.length ?? 0;

				if (nextHeaderMatch && nextHeaderLevel <= headerLevel) {
					const sectionEnd = lines.slice(0, j).join('\n').length;
					return { start: sectionStart, end: sectionEnd, contentStart };
				}
			}

			return { start: sectionStart, end: content.length, contentStart };
		}
	}

	return null;
}

export function insertAfterTag(content: string, tag: string, newContent: string): string {
	const section = findSectionByTag(content, tag);

	if (section) {
		// Insert after the tag line
		return (
			content.slice(0, section.contentStart) +
			newContent +
			(content.slice(section.contentStart).startsWith('\n') ? '' : '\n') +
			content.slice(section.contentStart)
		);
	}

	// Tag not found, append to end with new section
	return content + '\n\n' + tag + '\n' + newContent;
}

export function insertAfterSection(
	content: string,
	sectionHeader: string,
	newContent: string
): string {
	const section = findSectionByHeader(content, sectionHeader);

	if (section) {
		// Insert at the beginning of the section content
		return (
			content.slice(0, section.contentStart) +
			newContent +
			'\n' +
			content.slice(section.contentStart)
		);
	}

	// Section not found, append with new header
	return content + '\n\n' + sectionHeader + '\n' + newContent;
}

export function ensureSectionExists(content: string, sectionHeader: string): string {
	const section = findSectionByHeader(content, sectionHeader);

	if (section) {
		return content;
	}

	// Add section at end
	return content + '\n\n' + sectionHeader + '\n';
}

export function appendToSection(
	content: string,
	sectionHeader: string,
	newContent: string
): string {
	const section = findSectionByHeader(content, sectionHeader);

	if (section) {
		// Append at the end of the section
		const beforeSection = content.slice(0, section.end);
		const afterSection = content.slice(section.end);

		// Add newline if section doesn't end with one
		const separator = beforeSection.endsWith('\n') ? '' : '\n';

		return beforeSection + separator + newContent + '\n' + afterSection;
	}

	// Section not found, create it with content
	return content + '\n\n' + sectionHeader + '\n' + newContent + '\n';
}

export function replaceSection(
	content: string,
	sectionHeader: string,
	newSectionContent: string
): string {
	const section = findSectionByHeader(content, sectionHeader);

	if (section) {
		return (
			content.slice(0, section.contentStart) +
			newSectionContent +
			'\n' +
			content.slice(section.end)
		);
	}

	// Section not found, create it
	return content + '\n\n' + sectionHeader + '\n' + newSectionContent + '\n';
}

export function truncateContent(content: string, maxLength: number): string {
	if (content.length <= maxLength) {
		return content;
	}
	return content.slice(0, maxLength) + '...';
}
