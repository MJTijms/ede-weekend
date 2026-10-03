# Online opslag

`admin/` is de privébeheerapp met een D1-database. De platformtoegang staat uitsluitend de eigenaar toe. Iedere wijziging controleert bovendien de ingelogde identiteit, de herkomst van het verzoek en de revisie van de stand.

`reader/` bevat uitsluitend een leesroute op `/api/scores`. Die haalt precies één vaste score-URL op uit de privéapp. Er is geen beheer- of algemene proxyroute. De benodigde leessleutel staat alleen als geheim in Sites, nooit in deze repository.

De twee `.openai/hosting.json`-bestanden identificeren de bestaande Sites. Gebruik de normale Sites-workflow en behoud hun toegangsgrenzen: admin blijft privé; reader blijft openbaar. Publiceer ze niet met de GitHub Pages-workflow: die publiceert uitsluitend `publish/`.

De actieve Sites-checkouts staan lokaal in het naastliggende project `EDE-Cloud`. Deze map bewaart hun broncode ook op GitHub. Bij toekomstige wijzigingen houd je de checkouts en deze kopie gelijk. Voor de admin-build gebruikt deze repository automatisch `../../publish` als frontend; de actieve Site-checkout gebruikt zijn eigen `frontend/`-kopie.

De database wordt alleen bij de eerste keer lezen gevuld met de bewaarde stand in `initial-state.json`. Een latere deployment overschrijft bestaande scores niet. Nieuwe schemawijzigingen worden via nieuwe Drizzle-migraties toegepast.
