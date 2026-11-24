const NodeHelper = require("node_helper");
const Log = require("logger");
const { isWithinActiveHours, normalizeResponse } = require("./mpk_utils");

module.exports = NodeHelper.create({
	start () {
		this.timers = new Map();
		this.activeStates = new Map();
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
			const interval = Math.max(Number(config.updateInterval) || 1, 1) * 60 * 1000;
			this.timers.set(key, setInterval(() => this.fetchIfActive(config), interval));
		}
		this.fetchIfActive(config);
	},

	fetchIfActive (config) {
		const active = isWithinActiveHours(new Date(), config.activeFrom, config.activeTo);
		const stateKey = config.instanceId || config.stopId;
		if (!active) {
			if (this.activeStates.get(stateKey) !== false) {
				this.activeStates.set(stateKey, false);
				this.sendSocketNotification("MPK_INACTIVE", { instanceId: config.instanceId });
			}
			return;
		}
		this.activeStates.set(stateKey, true);
		this.fetchDepartures(config);
	},

	async fetchDepartures (config) {
		const url = config.endpoint
			.replace("{stopId}", encodeURIComponent(config.stopId))
			.replace("{limit}", encodeURIComponent(config.fetchLimit || config.maximumDepartures));
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
			const data = normalizeResponse(body, contentType, config.fetchLimit || config.maximumDepartures);
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
