# EDE vriendenweekend

De openbare app bevat het programma, de paklijst, de twee speelschema’s en het klassement. Alleen de bijnamen zijn opgenomen.

Openbare app: https://mjtijms.github.io/ede-weekend/

Broncode: https://github.com/MJTijms/ede-weekend

## Beheren

Dubbelklik op **Start EDE.cmd**. Laat het venster open zolang je uitslagen invoert. De beheerapp draait op je eigen laptop via `http://127.0.0.1:4173/`; de openbare app bevat geen beheerknoppen of wachtwoorden.

Een overwinning levert elke speler van het winnende team 1 punt op. Andere teams en gelijke uitslagen krijgen 0. Gedrag geeft +1 of −1. Correcties vervangen de eerdere uitslag.

Uitslagen worden direct op de laptop opgeslagen. Bij internetverbinding publiceert de beheerapp wijzigingen automatisch op GitHub. GitHub Pages heeft vervolgens doorgaans even nodig om de openbare stand bij te werken. De openbare app ververst de stand elke 30 seconden. Bij een mislukte publicatie blijven de lokale uitslagen bewaard en verschijnt een knop om opnieuw online bij te werken. GitHub moet op deze laptop aangemeld blijven.

## Project

- `publish/`: openbare GitHub Pages-app en actuele stand.
- `scripts/server.mjs`: lokale beheerapp. Geen gegevens van de laptop worden als server aangeboden.
- `tests/`: controles voor speelschema’s, puntentelling, opslag en toegang.
- `docs/`: lokale projectstatus; wordt niet gepubliceerd.

`npm test` controleert de kernfuncties. `npm run preview` opent een lokale versie zonder naar GitHub te schrijven; voor testuitslagen gebruik je een apart bestand via `EDE_DATA_FILE`.
