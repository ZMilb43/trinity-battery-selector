# Trinity Total Home — Powerwall 3 Battery Selector (demo)

Kitchen-table sizing demo for Tesla **Powerwall 3** and **expansion modules**. Pick the hardware, enter the customer’s annual kWh, and the page shows energy capacity, power capacity, and expected backup hours.

Live (GitHub Pages): after this repo is published, open
`https://zmilb43.github.io/trinity-battery-selector/`

## What it calculates

| Result | Formula |
| --- | --- |
| Energy (kWh) | `(Powerwall 3 count + expansion count) × 13.5` |
| Power (kW) | `Powerwall 3 count × 11.5` continuous on-grid |
| Off-grid power (kW) | `Powerwall 3 count × 15.4` (11.5 kW config, 80 A breaker) |
| Average load (kW) | `annual kWh ÷ 8,760` (or 40% of that on Essentials) |
| Runtime (hours) | `energy kWh ÷ average load kW` |

Runtime assumes the battery is full at the start of an outage and the home draws a steady load equal to its annual average. Real outages are lumpier.

## Tesla limits encoded in the tool

- 1–4 Powerwall 3 units
- 0–3 expansion modules, connected to the leader Powerwall 3
- 7 units maximum (4 Powerwall 3 + 3 expansions → 94.5 kWh, 46 kW)
- Expansions add 13.5 kWh only. They do not add inverter power.
- Charge power is 5 kW per Powerwall 3, or 8 kW on the leader when expansions are installed

## Spec source

[Tesla Powerwall 3 Datasheet (US, 2025)](https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/Datasheet/en-us/Powerwall-3-Datasheet.pdf)

- Nominal battery energy: **13.5 kWh AC** (Powerwall 3 and expansion)
- Nominal output power: **11.5 kW** (also configurable 5.8 / 7.6 / 10 kW)
- Off-grid continuous discharge: **15.4 kW** when the on-grid rating is 11.5 kW
- Charge: **5 kW** Powerwall 3 only, **8 kW** with up to 3 expansions
- Power scalability: up to **4** Powerwall 3 units
- Energy scalability: up to **3** expansion units (max **7** units total)

This is an internal Trinity Total Home demo. It is not a Tesla product and not a contract proposal.

## Local preview

Open `index.html` in a browser, or from this folder:

```bash
python3 -m http.server 4173
```

Then visit `http://127.0.0.1:4173`.
