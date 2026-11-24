Module.register("MMM-WroclawMPK", {
	defaults: {
		stopId: "",
		stopName: "",
		maximumDepartures: 8,
		cachedDepartures: 24,
		updateInterval: 1,
		activeFrom: "06:00",
		activeTo: "22:00",
		endpoint: "https://transit.land/api/v2/rest/stops/{stopId}/departures?next=3600&limit={limit}",
		apiKey: "",
		showPlatform: true,
		showDestination: true,
		showStatus: true
	},

	start () {
		this.departures = [];
		this.stopLabel = this.config.stopName || this.config.stopId;
		this.lastUpdated = null;
		this.error = null;
		this.hasLoaded = false;
		this.countdownTimer = setInterval(() => {
			if (this.departures.length > 0 && !this.inactive) this.updateDom(0);
		}, 30000);
	},

	notificationReceived (notification, payload) {
		if (notification === "DOM_OBJECTS_CREATED") {
			this.sendSocketNotification("FETCH_DEPARTURES", this.requestConfig());
		}
		if (notification === "MPK_DEPARTURES") {
			if (payload.instanceId !== this.identifier) return;
			this.inactive = false;
			this.departures = payload.departures || [];
			this.hasLoaded = true;
			this.stopLabel = payload.stopName || this.config.stopName || this.config.stopId;
			this.lastUpdated = new Date(payload.fetchedAt);
			this.error = null;
			this.updateDom(300);
		}
		if (notification === "MPK_ERROR") {
			if (payload.instanceId !== this.identifier) return;
			this.error = payload.message || "Nie udało się pobrać odjazdów";
			this.updateDom(300);
		}
		if (notification === "MPK_INACTIVE") {
			if (payload.instanceId !== this.identifier) return;
			this.inactive = true;
			this.updateDom(300);
		}
	},

	socketNotificationReceived (notification, payload) {
		this.notificationReceived(notification, payload);
	},

	requestConfig () {
		return {
			instanceId: this.identifier,
			stopId: this.config.stopId,
			endpoint: this.config.endpoint,
			apiKey: this.config.apiKey,
			maximumDepartures: this.config.maximumDepartures,
			fetchLimit: this.config.cachedDepartures,
			updateInterval: this.config.updateInterval,
			activeFrom: this.config.activeFrom,
			activeTo: this.config.activeTo
		};
	},

	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = "mmm-wroclaw-mpk";

		const heading = document.createElement("header");
		heading.className = "mmm-wroclaw-mpk-header";
		heading.innerHTML = `<span class="mmm-wroclaw-mpk-title">${this.config.title || "Odjazdy"}</span><span class="mmm-wroclaw-mpk-stop">${this.stopLabel}</span>`;
		wrapper.appendChild(heading);

		if (this.inactive) {
			const inactive = document.createElement("div");
			inactive.className = "dimmed light small";
			inactive.textContent = `Odjazdy wstrzymane (${this.config.activeFrom}–${this.config.activeTo})`;
			wrapper.appendChild(inactive);
			return wrapper;
		}

		if (this.error && this.departures.length === 0) {
			const error = document.createElement("div");
			error.className = "dimmed light small mmm-wroclaw-mpk-error";
			error.textContent = this.error;
			wrapper.appendChild(error);
			return wrapper;
		}

		if (!this.hasLoaded && this.departures.length === 0) {
			const loading = document.createElement("div");
			loading.className = "dimmed light small";
			loading.textContent = "Ładowanie odjazdów…";
			wrapper.appendChild(loading);
			return wrapper;
		}

		if (this.departures.length === 0) {
			const empty = document.createElement("div");
			empty.className = "dimmed light small";
			empty.textContent = "Brak odjazdów w ciągu najbliższej godziny";
			wrapper.appendChild(empty);
			return wrapper;
		}

		const table = document.createElement("table");
		table.className = "small";
		const upcomingDepartures = this.departures
			.filter((departure) => this.getDepartureMinutesRemaining(departure) > 0)
			.slice(0, this.config.maximumDepartures);
		if (upcomingDepartures.length === 0) {
			const empty = document.createElement("div");
			empty.className = "dimmed light small";
			empty.textContent = "Brak nadchodzących odjazdów";
			wrapper.appendChild(empty);
			return wrapper;
		}
		for (const departure of upcomingDepartures) {
			const row = document.createElement("tr");
			const line = document.createElement("td");
			line.className = "mmm-wroclaw-mpk-line bright";
			line.textContent = departure.line || "—";
			row.appendChild(line);

			if (this.config.showDestination) {
				const destination = document.createElement("td");
				destination.className = "mmm-wroclaw-mpk-destination";
				destination.textContent = departure.destination || "";
				row.appendChild(destination);
			}

			if (this.config.showPlatform && departure.platform) {
				const platform = document.createElement("td");
				platform.className = "mmm-wroclaw-mpk-platform dimmed";
				platform.textContent = departure.platform;
				row.appendChild(platform);
			}

			const time = document.createElement("td");
			time.className = "mmm-wroclaw-mpk-time bright";
			time.textContent = this.getDepartureDisplayTime(departure);
			row.appendChild(time);
			table.appendChild(row);
		}
		wrapper.appendChild(table);

		if (this.config.showStatus && this.lastUpdated) {
			const status = document.createElement("div");
			status.className = "dimmed xsmall mmm-wroclaw-mpk-status";
			status.textContent = `Aktualizacja: ${this.lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
			wrapper.appendChild(status);
		}
		return wrapper;
	},

	getDepartureDisplayTime (departure) {
		const minutes = this.getDepartureMinutesRemaining(departure);
		if (minutes !== null) {
			return minutes === 0 ? "teraz" : `za ${minutes} min`;
		}
		return departure.displayTime;
	},

	getDepartureMinutesRemaining (departure) {
		if (!Number.isFinite(Number(departure.minutesRemaining)) || !this.lastUpdated) return null;
		const elapsedMinutes = (Date.now() - this.lastUpdated.getTime()) / 60000;
		return Math.max(0, Math.ceil(Number(departure.minutesRemaining) - elapsedMinutes));
	},

	getStyles () {
		return ["MMM-WroclawMPK.css"];
	}
});
