# EDE vriendenweekend

De openbare app bevat het programma, de paklijst, de twee speelschema’s en het klassement. Alleen de bijnamen zijn opgenomen.

Openbare app: https://mjtijms.github.io/ede-weekend/

Broncode: https://github.com/MJTijms/ede-weekend

## Beheren

Open **https://ede-weekend-beheer.mark-tijms.chatgpt.site/** op je telefoon of laptop en log in met hetzelfde ChatGPT-account waarmee de app is gemaakt. De beheerpagina is privé. De knop **Beheer** in de openbare app brengt je naar deze pagina. Je kunt de beheerpagina ook toevoegen aan het beginscherm van je telefoon.

**Start EDE.cmd** opent voortaan dezelfde online beheerpagina. Er draait geen lokale server meer voor normale invoer; de laptop kan uit blijven.

Een overwinning levert elke speler van het winnende team 1 punt op. Andere teams en gelijke uitslagen krijgen 0. Gedrag geeft +1 of −1. Correcties vervangen de eerdere uitslag.

Uitslagen staan in gedeelde online opslag. De openbare app haalt de stand elke 30 seconden op; beheer ververs je iedere 5 seconden. Voor invoeren is internet nodig. Als opslaan mislukt, meldt de app dit. Een oudere telefoon- of laptopsessie kan geen nieuwere stand overschrijven.

De openbare route kan uitsluitend scores lezen. De beheerpagina controleert op iedere wijziging je ingelogde identiteit en de herkomst van het verzoek. De app vraagt geen bestandsrechten, OneDrive-toegang of toegang tot andere accounts. Servergeheimen worden uitsluitend in de hostingomgeving opgeslagen, nooit in GitHub of browsercode.

## Project

- `publish/`: openbare GitHub Pages-app; `scores.json` is alleen de bewaarde stand van vóór de cloudmigratie.
- `cloud/`: broncode van de privébeheerapp en de openbare leesroute. Deployments worden met de Sites-workflow beheerd.
- `scripts/server.mjs`: opent de online beheerpagina; alleen de testmodus biedt nog een lokale server.
- `tests/`: controles voor speelschema’s, puntentelling, opslag en toegang.
- `docs/`: lokale projectstatus; wordt niet gepubliceerd.

`npm test` controleert de kernfuncties. De cloudtests gebruiken tijdelijke testdatabases. Testuitslagen worden nooit naar de echte weekendopslag geschreven.
