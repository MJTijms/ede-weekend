export const PLAYERS = ['Bofditch','Chulo','Crocky','Daaltjes','Don Tol','Faplo','Geep','Kaas','Meisjeshaar','Party Tijms','Q','Slosla'];
const t = (...names) => names;
const game = (id, name, teams) => ({id, name, teams, kind:'game'});
export const GAMES = [
 [game('g1h','Hitster',[t('Daaltjes','Slosla'),t('Don Tol','Party Tijms'),t('Geep','Kaas')]),game('g1s','30 Seconds',[t('Bofditch','Q'),t('Chulo','Meisjeshaar'),t('Crocky','Faplo')]),null],
 [null,game('g2s','30 Seconds',[t('Bofditch','Daaltjes'),t('Crocky','Geep'),t('Don Tol','Meisjeshaar')]),game('g2c','Codenames',[t('Chulo','Kaas','Q'),t('Faplo','Party Tijms','Slosla')])],
 [game('g3h','Hitster',[t('Chulo','Geep'),t('Daaltjes','Q'),t('Don Tol','Faplo')]),null,game('g3c','Codenames',[t('Bofditch','Crocky','Slosla'),t('Kaas','Meisjeshaar','Party Tijms')])],
 [game('g4h','Hitster',[t('Bofditch','Faplo'),t('Chulo','Crocky'),t('Meisjeshaar','Q')]),game('g4s','30 Seconds',[t('Daaltjes','Party Tijms'),t('Don Tol','Kaas'),t('Geep','Slosla')]),null],
 [null,game('g5s','30 Seconds',[t('Chulo','Faplo'),t('Kaas','Slosla'),t('Party Tijms','Q')]),game('g5c','Codenames',[t('Bofditch','Don Tol','Geep'),t('Crocky','Daaltjes','Meisjeshaar')])],
 [game('g6h','Hitster',[t('Bofditch','Party Tijms'),t('Crocky','Kaas'),t('Meisjeshaar','Slosla')]),null,game('g6c','Codenames',[t('Chulo','Daaltjes','Don Tol'),t('Faplo','Geep','Q')])]
];
const padel = (round, court, time, a, b) => ({id:`p${round}b${court}`,name:`Baan ${court}`,teams:[a,b],kind:'padel',time,court});
export const PADEL = [
 [padel(1,1,'11:00–11:15',t('Party Tijms','Crocky'),t('Chulo','Don Tol')),padel(1,2,'11:00–11:15',t('Meisjeshaar','Daaltjes'),t('Kaas','Faplo'))],
 [padel(2,1,'11:20–11:35',t('Party Tijms','Geep'),t('Slosla','Kaas')),padel(2,2,'11:20–11:35',t('Bofditch','Daaltjes'),t('Q','Crocky'))],
 [padel(3,1,'11:40–11:55',t('Meisjeshaar','Q'),t('Chulo','Geep')),padel(3,2,'11:40–11:55',t('Party Tijms','Bofditch'),t('Faplo','Don Tol'))],
 [padel(4,1,'12:00–12:15',t('Chulo','Daaltjes'),t('Kaas','Bofditch')),padel(4,2,'12:00–12:15',t('Slosla','Crocky'),t('Faplo','Q'))],
 [padel(5,1,'12:20–12:35',t('Kaas','Don Tol'),t('Faplo','Geep')),padel(5,2,'12:20–12:35',t('Meisjeshaar','Slosla'),t('Party Tijms','Chulo'))],
 [padel(6,1,'12:40–12:55',t('Slosla','Daaltjes'),t('Don Tol','Q')),padel(6,2,'12:40–12:55',t('Meisjeshaar','Crocky'),t('Geep','Bofditch'))]
];
export const MATCHES = [...GAMES.flat().filter(Boolean),...PADEL.flat()];
export const PACKING = [
 {title:'De basis',items:['Ondergoed & sokken','T-shirts, broeken & warme trui','Jas / regenjas','Sneakers & slippers','Pyjama / slaapkleding','Tandenborstel & tandpasta','Deo, douchegel & shampoo','Scheerspullen & haarspul','Medicijnen & lenzen / bril','Telefoon & oplader','ID, pinpas & wat cash','Oordoppen voor het slapen']},
 {title:'Sport en Welness',items:['Padelracket','1 of 2 sportoutfits','Sportschoenen & sportsokken','Zwembroek','Eigen handdoeken']},
 {title:'Zaterdagavond',items:['Gelikte kleding om te escaleren']},
 {title:'Door 1 iemand mee te nemen',items:['Bluetoothspeaker + oplader','Voetbal (als iemand die heeft)','Nespresso-cups (als je ze thuis hebt)']}
];
export const PLANNING = [
 {day:'Vrijdag',date:'23 oktober',tag:'Game Night',items:[['12:00–15:00','Vertrek shift 1',['Onderweg lunchen','Boodschappen doen']],['15:00–19:00','Vrij programma',['Inchecken vanaf 15:00 · Bospark Ede']],['19:00–21:00','Aankomst shift 2',['Avondeten bestellen of vrijwillige kokers?']],['21:00–00:00','Game Night',[]]]},
 {day:'Zaterdag',date:'24 oktober',tag:'Let’s escalate',items:[['Ochtend','Vrij ontbijt',[]],['10:30–13:30','Padeltoernooi',['10:30 vertrek naar de padelhal','11:00–13:00 spelen · rond 13:30 terug']],['13:30–15:00','Vrij programma',[]],['15:00–16:00','Op naar het avondprogramma',['Taxi of Uber']],['16:00–18:00','Waar is Party',[]],['18:30–21:30','All you can eat & drink',['Met table service. Dus niet zelf lopen.']],['21:30–???','Escaleren',['Eindtijd onbekend']]]},
 {day:'Zondag',date:'25 oktober',tag:'Alles kan, niks moet',items:[['Hele dag','Welness bij Bospark Ede',['Vul je dag zelf in. De accommodatie is de hele dag van ons.']],['Jouw eindtijd','Vertrek wanneer jij wilt',['De liefhebber mag nog blijven slapen en maandag 26 oktober vertrekken.']]]}
];
