const { describe, expect, it } = require("vitest");
const { normalizeResponse } = require("./mpk_utils");

describe("MMM-WroclawMPK response normalizer", () => {
	it("normalizes JSON departures", () => {
		const result = normalizeResponse(JSON.stringify({ stopName: "Rynek", departures: [{ line: "10", destination: "Leśnica", minutes: 4 }] }), "application/json");
		expect(result).toMatchObject({ stopName: "Rynek", departures: [{ line: "10", destination: "Leśnica", platform: "", displayTime: "za 4 min", minutesRemaining: 4 }] });
	});

	it("supports HTML tables", () => {
		const result = normalizeResponse("<table><tr><td>20</td><td>Oporów</td><td>12:34</td></tr></table>", "text/html");
		expect(result.departures[0]).toMatchObject({ line: "20", destination: "Oporów", displayTime: "12:34" });
	});

	it("normalizes Transitland departures", () => {
		const result = normalizeResponse(JSON.stringify({ stops: [{ stop_name: "Rynek", departures: [{ stop_headsign: "Biskupin", departure: { scheduled: "23:59:00" }, trip: { route: { route_short_name: "2" } } }] }] }), "application/json");
		expect(result.stopName).toBe("Rynek");
		expect(result.departures[0]).toMatchObject({ line: "2", destination: "Biskupin", displayTime: "23:59" });
	});
});
