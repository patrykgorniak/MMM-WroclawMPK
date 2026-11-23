# MMM-WroclawMPK

## English

MagicMirror module that displays upcoming departures from a selected MPK Wrocław stop.

### Configuration

Add the module to `config/config.js`:

```js
{
	module: "MMM-WroclawMPK",
	position: "top_right",
	config: {
		stopId: "s-u3h4v8uj3z-magellana",
		stopName: "Magellana",
		maximumDepartures: 8,
		updateInterval: 60000,
		apiKey: "YOUR_TRANSITLAND_API_KEY"
	}
}
```

By default, the module uses the Transitland `stops/{stopId}/departures` endpoint, which indexes Wrocław's official GTFS feed. Transitland requires an API key supplied through `apiKey`. `stopId` must identify a specific Transitland stop, for example `s-u3h4v8uj3z-magellana` for Magellana. A feed identifier beginning with `f-` is not a stop identifier.

MPK Wrocław does not provide a simple official REST endpoint such as `/rozklady/odjazdy?stop=...`. The `https://mpk.wroc.pl/bus_position` endpoint provides vehicle positions and uses POST, so it cannot replace a departures board by itself.

You may provide a custom endpoint through `endpoint`; the `{stopId}` and `{limit}` placeholders are supported.

The module recognizes JSON responses containing a `departures`, `odjazdy`, `results`, or `data` array. A departure may use the fields `line`, `destination`, `platform`, `time`, or `minutes`. A basic HTML table fallback is also available.

---

## Polski

Moduł MagicMirror wyświetlający najbliższe odjazdy zadanego przystanku MPK Wrocław.

## Konfiguracja

Dodaj moduł do `config/config.js`:

```js
{
	module: "MMM-WroclawMPK",
	position: "top_right",
	config: {
		stopId: "s-u3h4v8uj3z-magellana",
		stopName: "Przystanek docelowy",
		maximumDepartures: 8,
		updateInterval: 60000,
		apiKey: "TWOJ_KLUCZ_TRANSITLAND"
	}
}
```

Domyślnie moduł korzysta z endpointu Transitland `stops/{stopId}/departures`, który indeksuje oficjalny feed GTFS Wrocławia. Endpoint Transitland wymaga klucza API w opcji `apiKey`. `stopId` powinien być identyfikatorem konkretnego przystanku Transitland, np. `s-u3h4v8uj3z-magellana` dla przystanku Magellana. Sam identyfikator feedu, zaczynający się od `f-`, nie jest identyfikatorem przystanku.

MPK Wrocław nie udostępnia prostego, oficjalnego endpointu REST w rodzaju `/rozklady/odjazdy?stop=...`. Endpoint `https://mpk.wroc.pl/bus_position` służy do pozycji pojazdów i jest metodą POST, więc nie może sam zastąpić tablicy odjazdów.

Można podać własny endpoint opcją `endpoint`; obsługiwane są placeholdery `{stopId}` i `{limit}`.

Moduł rozpoznaje odpowiedzi JSON zawierające tablicę `departures`, `odjazdy`, `results` albo `data`. Pojedynczy odjazd może używać pól `line`, `destination`, `platform`, `time` lub `minutes`. Dostępny jest również prosty fallback dla tabel HTML.
