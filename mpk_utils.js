function normalizeResponse (body, contentType, maximumDepartures = 8) {
	let payload = body;
	if (contentType.includes("json") || body.trim().startsWith("{") || body.trim().startsWith("[")) {
		payload = JSON.parse(body);
	}

	const transitlandStop = payload && payload.stops && payload.stops[0];
	const stopName = transitlandStop?.stop_name || (payload && !Array.isArray(payload) ? (payload.stopName || payload.stop_name || payload.name || "") : "");
	const source = transitlandStop?.departures || (Array.isArray(payload) ? payload : payload.departures || payload.odjazdy || payload.results || payload.data || []);
	const departures = Array.isArray(source) ? source.map(normalizeDeparture).filter(Boolean) : parseHtml(String(body));
	return { stopName, departures: departures.slice(0, maximumDepartures) };
}

function normalizeDeparture (item) {
	if (!item || typeof item !== "object") return null;
	const event = item.departure || item.arrival || {};
	const rawTime = item.displayTime || event.estimated_local || event.estimated || event.scheduled_local || event.scheduled || (typeof item.departure === "string" ? item.departure : undefined) || item.time || item.departureTime || item.departure_time || item.estimatedTime;
	const displayTime = formatTime(rawTime, item.minutes, event.estimated_delay);
	if (!displayTime) return null;
	return {
		line: String(item.line || item.route || item.routeShortName || item.route_short_name || item.trip?.route?.route_short_name || ""),
		destination: String(item.destination || item.headsign || item.direction || item.stop_headsign || item.trip?.trip_headsign || ""),
		platform: String(item.platform || item.stop_sequence || ""),
		displayTime
	};
}

function formatTime (value, minutes, delay = 0) {
	if (Number.isFinite(Number(minutes))) return Number(minutes) <= 0 ? "teraz" : `za ${Number(minutes)} min`;
	if (value === undefined || value === null) return "";
	const text = String(value).trim();
	if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
		const departure = new Date(text);
		const minutesUntil = Math.round((departure.getTime() - Date.now()) / 60000) + Number(delay || 0) / 60;
		return minutesUntil <= 0 ? "teraz" : `za ${Math.round(minutesUntil)} min`;
	}
	if (/^\d{1,2}:\d{2}/.test(text)) return text.slice(0, 5);
	if (/^\d+$/.test(text)) return `za ${text} min`;
	return text;
}

function parseHtml (html) {
	const rows = [];
	const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
	let rowMatch;
	while ((rowMatch = rowPattern.exec(html)) !== null) {
		const cells = [...rowMatch[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
			.map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
		if (cells.length >= 2 && /\d{1,2}:\d{2}|\d+\s*min/i.test(cells.join(" "))) {
			const timeIndex = cells.findIndex((cell) => /\d{1,2}:\d{2}|\d+\s*min/i.test(cell));
			rows.push({ line: cells[0], destination: cells.slice(1, timeIndex).join(" "), displayTime: cells[timeIndex] });
		}
	}
	return rows;
}

module.exports = { normalizeResponse };
