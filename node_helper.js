const NodeHelper = require("node_helper");
const Log = require("logger");
const { normalizeResponse } = require("./mpk_utils");

module.exports = NodeHelper.create({
	start () {
		this.timers = new Map();
	},

	socketNotificationReceived (notification, config) {
		if (notification === "FETCH_DEPARTURES") {
			this.startFetcher(config);
		}
	},

	startFetcher (config) {
		if (!config.stopId) {
			this.sendSocketNotification("MPK_ERROR", { instanceId: config.instanceId, message: "Nie skonfigurowano numeru przystanku." });
			return;
		}

		const key = `${config.instanceId}:${config.endpoint}:${config.stopId}`;
		if (!this.timers.has(key)) {
			const interval = Math.max(Number(config.updateInterval) || 60000, 30000);
			this.timers.set(key, setInterval(() => this.fetchDepartures(config), interval));
		}
		this.fetchDepartures(config);
	},

	async fetchDepartures (config) {
		const url = config.endpoint
			.replace("{stopId}", encodeURIComponent(config.stopId))
			.replace("{limit}", encodeURIComponent(config.maximumDepartures));
		try {
			const response = await fetch(url, {
				headers: {
					Accept: "application/json, text/html",
					...(config.apiKey ? { apikey: config.apiKey } : {})
				},
				signal: AbortSignal.timeout(15000)
			});
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const body = await response.text();
			const contentType = response.headers.get("content-type") || "";
			const data = normalizeResponse(body, contentType, config.maximumDepartures);
			this.sendSocketNotification("MPK_DEPARTURES", {
				instanceId: config.instanceId,
				departures: data.departures,
				stopName: data.stopName,
				fetchedAt: new Date().toISOString()
			});
		} catch (error) {
			Log.error(`[${this.name}] Could not fetch departures: ${error.message}`);
			this.sendSocketNotification("MPK_ERROR", { instanceId: config.instanceId, message: `Błąd danych MPK: ${error.message}` });
		}
	}
});
