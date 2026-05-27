// components/BusDataUploader.js
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { database } from '../firebase/config';
import { ref, set } from 'firebase/database';

const BusDataUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Your bus data array
  const busData = [
  {
    "serviceNO": "KGL 1/3",
    "Source": "Proddutur", 
    "destination": "Kurnool",
    "ScheduleDeparture": "04:30:00",
    "ScheduleArrival": "08:45:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39Z0868",
    "DepotName": "koyalakuntla",
    "DriverName": "K NARASHUDU",
    "STOPROUTES": "PRODDUTUR-DEVAGUDI-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-ORVAKAL-KURNOOL",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "KNL2/1",
    "Source": "Proddutur",
    "destination": "Kurnool", 
    "ScheduleDeparture": "05:00:00",
    "ScheduleArrival": "09:00:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UF7576",
    "DepotName": "proddutur",
    "DriverName": "D SHREEHARI",
    "STOPROUTES": "PRODDUTUR-DEVAGUDI-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-ORVAKAL-KURNOOL",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "KNL0/1",
    "Source": "Proddutur",
    "destination": "Kurnool",
    "ScheduleDeparture": "05:30:00", 
    "ScheduleArrival": "09:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UG4742",
    "DepotName": "proddutur",
    "DriverName": "TS KOUSER BANU",
    "STOPROUTES": "PRODDUTUR-DEVAGUDI-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-ORVAKAL-KURNOOL",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "6174",
    "Source": "Proddutur",
    "destination": "Hyderabad MGBS",
    "ScheduleDeparture": "06:00:00",
    "ScheduleArrival": "16:20:00",
    "BusType": "SUPER LUXRY", 
    "BusNumber": "AP04Z0237",
    "DepotName": "proddutur",
    "DriverName": "N OBULESU",
    "STOPROUTES": "PRODDUTUR-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-KURNOOL-PANCHALINGALA ST BORDER-YERRAVALLI X RD-PEBBAIR-KOTHAKOTA-BHUTPURX ROAD-JEDCHERLA-SHAMSHABAD-ARAMGHAR-PURANPOOL-HYD-AFZALGUNJ-HYDERABAD MGBS",
    "capacity": 40,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "KNL3/1",
    "Source": "Proddutur", 
    "destination": "Kurnool",
    "ScheduleDeparture": "06:30:00",
    "ScheduleArrival": "11:10:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP04Z0278",
    "DepotName": "proddutur",
    "DriverName": "J S NARAYANAMMA", 
    "STOPROUTES": "PRODDUTUR-DEVAGUDI-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-ORVAKAL-KURNOOL",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "KNL4/1",
    "Source": "Proddutur",
    "destination": "Kurnool",
    "ScheduleDeparture": "07:00:00",
    "ScheduleArrival": "11:40:00", 
    "BusType": "EXPRESS",
    "BusNumber": "AP39UW336",
    "DepotName": "proddutur",
    "DriverName": "M S NAGAIAH",
    "STOPROUTES": "PRODDUTUR-DEVAGUDI-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-ORVAKAL-KURNOOL",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "KNL8/1", 
    "Source": "Proddutur",
    "destination": "Kurnool",
    "ScheduleDeparture": "07:30:00",
    "ScheduleArrival": "12:10:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UZ9366",
    "DepotName": "proddutur",
    "DriverName": "T CHALAPATHI",
    "STOPROUTES": "PRODDUTUR-DEVAGUDI-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-ORVAKAL-KURNOOL",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "KNL7/1",
    "Source": "Proddutur",
    "destination": "Kurnool", 
    "ScheduleDeparture": "08:00:00",
    "ScheduleArrival": "09:36:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP04Z0270",
    "DepotName": "proddutur",
    "DriverName": "G.C.S REDDY",
    "STOPROUTES": "PRODDUTUR-DEVAGUDI-JAMMALAMADUGU-GUNDLAKUNTA-NOSSAM-MAYALURU-KOILAKUNTLA-BANAGANAPALLY-BETHAMCHERLA-ORVAKAL-KURNOOL",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "50222",
    "Source": "Proddutur",
    "destination": "TIRUPATHI",
    "ScheduleDeparture": "03:30:00",
    "ScheduleArrival": "08:15:00",
    "BusType": "ULTRA DELUXE", 
    "BusNumber": "AP04Z0268",
    "DepotName": "proddutur",
    "DriverName": "D S KESAVA",
    "STOPROUTES": "PRODDUTUR-CHAPADU-MYDUKUR-KHAJIPET-KADAPA-BAKARAPET-ONTIMITA-NANDALUR-RAJAMPET-PULLAMPET-KODUR-RENIGUNTA-TIRUPATHI",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "9093/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "03:10:00",
    "ScheduleArrival": "04:40:00",
    "BusType": "EXPRESS",
    "BusNumber": "",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "",
    "STOPROUTES": "ICHAPURAM-KANCHILI-SOMPETA-BARUVA-HARIPURAM-PALASA-NANDIGAM-TEKKALI-NARASANNAPETA-SRIKAKULAM1-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-Costa-Pydibhimavaram-Pusapatirega-Nathavalasa-Denkada-Vizianagaram",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ02/1",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "05:30:00",
    "ScheduleArrival": "07:05:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP30Z0233",
    "DepotName": "SRIKAKULAM",
    "DriverName": "V V R MURTHY",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ04/1",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "06:00:00",
    "ScheduleArrival": "07:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP30Z0110",
    "DepotName": "SRIKAKULAM",
    "DriverName": "D M RAO",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ12/1",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "06:20:00",
    "ScheduleArrival": "07:55:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UY2199",
    "DepotName": "SRIKAKULAM",
    "DriverName": "B R KRISHNA",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ15/1",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "06:40:00",
    "ScheduleArrival": "08:15:00",
    "BusType": "EXPRESS",
    "BusNumber": "Ap39UW8859",
    "DepotName": "SRIKAKULAM",
    "DriverName": "N V R MURTHY",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ14/1",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "06:55:00",
    "ScheduleArrival": "08:30:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39WB2199",
    "DepotName": "SRIKAKULAM",
    "DriverName": "TA RAJU",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "P067/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "07:30:00",
    "ScheduleArrival": "09:05:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0265",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "M SRINIVAS",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ17/1",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "07:45:00",
    "ScheduleArrival": "09:20:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UJ4444",
    "DepotName": "SRIKAKULAM",
    "DriverName": "B K KUMARI",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "P071/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "08:00:00",
    "ScheduleArrival": "09:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0337",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "B D RAO",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "PO73/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "08:15:00",
    "ScheduleArrival": "09:50:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0377",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "K S NARAYANA",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "PO69/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "08:30:00",
    "ScheduleArrival": "10:05:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0464",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "D S NARAYANA",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "SK01/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "08:45:00",
    "ScheduleArrival": "10:20:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UG5641",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "V P RAJU",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "SKO2/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "09:00:00",
    "ScheduleArrival": "10:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UG5817",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "P LAVANYA",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ02/3",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "09:20:00",
    "ScheduleArrival": "10:55:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP30Z0233",
    "DepotName": "SRIKAKULAM",
    "DriverName": "V V R MURTHY",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "SK03/2",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "09:40:00",
    "ScheduleArrival": "11:15:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UG5715",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "M V S NARAYANA",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ04/3",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "10:00:00",
    "ScheduleArrival": "11:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP30Z0110",
    "DepotName": "SRIKAKULAM",
    "DriverName": "D M RAO",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ13/1",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "10:20:00",
    "ScheduleArrival": "11:55:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UY2199",
    "DepotName": "SRIKAKULAM",
    "DriverName": "M D P RAO",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ15/3",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "10:40:00",
    "ScheduleArrival": "12:15:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UW8859",
    "DepotName": "SRIKAKULAM",
    "DriverName": "N V R MURTHY",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ16/30",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "11:00:00",
    "ScheduleArrival": "12:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UW8857",
    "DepotName": "SRIKAKULAM",
    "DriverName": "A K RAO",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ14/3",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "11:00:00",
    "ScheduleArrival": "12:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39WB2199",
    "DepotName": "SRIKAKULAM",
    "DriverName": "TA RAJU",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "PO67/4",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "11:30:00",
    "ScheduleArrival": "13:05:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0265",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "M SRINIVAS",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VZ17/3",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "11:45:00",
    "ScheduleArrival": "13:20:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP39UJ4444",
    "DepotName": "SRIKAKULAM",
    "DriverName": "B K KUMARI",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "PO71/4",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "12:00:00",
    "ScheduleArrival": "13:35:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0337",
    "DepotName": "SRIKAKULAM",
    "DriverName": "B D RAO",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "P073/4",
    "Source": "SRIKAKULAM",
    "destination": "VIZIANAGARAM",
    "ScheduleDeparture": "12:20:00",
    "ScheduleArrival": "13:55:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0377",
    "DepotName": "VIZIANAGARAM",
    "DriverName": "K S NARAYANA",
    "STOPROUTES": "SRIKAKULAM1-ETCHERLA-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-COST-PYDIBHIMAVARAM-PUSAPATIREGA-DENKADA-VIZIANAGARAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "S013/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "04:45:00",
    "ScheduleArrival": "07:00:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0698",
    "DepotName": "SRIKAKULAM",
    "DriverName": "V VEERABHADRA RAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "9021/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:00:00",
    "ScheduleArrival": "07:15:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP40Z0191",
    "DepotName": "SRIKAKULAM",
    "DriverName": "L D RAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "9073/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:00:00",
    "ScheduleArrival": "08:00:00",
    "BusType": "PALLEVELUGU",
    "BusNumber": "AP30Z0090",
    "DepotName": "SRIKAKULAM",
    "DriverName": "G G RAO",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V281/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:00:00",
    "ScheduleArrival": "07:45:00",
    "BusType": "ULTRA PALLEVELUGU",
    "BusNumber": "AP30Z0236",
    "DepotName": "SRIKAKULAM",
    "DriverName": "P V R MURTHY",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "NOO5/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:00:00",
    "ScheduleArrival": "07:00:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP30Z0188",
    "DepotName": "SRIKAKULAM",
    "DriverName": "N SAMBAYYA",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V025/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:30:00",
    "ScheduleArrival": "08:15:00",
    "BusType": "PALLEVELUGU",
    "BusNumber": "AP30TC5569",
    "DepotName": "SRIKAKULAM",
    "DriverName": "K V RATNAM",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "9043/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:30:00",
    "ScheduleArrival": "07:50:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP29Z3806",
    "DepotName": "SRIKAKULAM",
    "DriverName": "G VISALASHI",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V125/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:40:00",
    "ScheduleArrival": "07:40:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP40Z0653",
    "DepotName": "SRIKAKULAM",
    "DriverName": "M N B RAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "N008/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:45:00",
    "ScheduleArrival": "07:45:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP30Z0184",
    "DepotName": "SRIKAKULAM",
    "DriverName": "N CH FRAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VS02/1",
    "Source": "TEKKALI",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "04:30:00",
    "ScheduleArrival": "08:00:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP30Z0191",
    "DepotName": "TEKKALI",
    "DriverName": "B D J RAO",
    "STOPROUTES": "TEKKALI-KOTHAPETA-NIMMADA-NARASANNAPETA-SRIKAKULAM-CHILAKAPALEM-SUBHARAPURAM-RANASTHALAM-COSTA-PYDIBHEEMAVAARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V003/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:50:00",
    "ScheduleArrival": "09:00:00",
    "BusType": "PALLEVELUGU",
    "BusNumber": "AP30Y4555",
    "DepotName": "SRIKAKULAM",
    "DriverName": "I V RAO",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "N011/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "06:00:00",
    "ScheduleArrival": "08:00:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP30Z0180",
    "DepotName": "SRIKAKULAM",
    "DriverName": "G CH RAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VS02/1_PALASA",
    "Source": "PALASA",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "04:00:00",
    "ScheduleArrival": "08:30:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP39WD2129",
    "DepotName": "PALASA",
    "DriverName": "N PRASAD",
    "STOPROUTES": "PALASA-TEKKALI-KOTHAPETA-NIMMADA-NARASANNAPETA-SRIKAKULAM-CHILAKAPALEM-SUBHARAPURAM-RANASTHALAM-COSTA-PYDIBHEEMAVAARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "9020/1",
    "Source": "TEKKALI",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:00:00",
    "ScheduleArrival": "09:15:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP30Z0200",
    "DepotName": "TEKKALI",
    "DriverName": "M B RAO",
    "STOPROUTES": "TEKKALI-KOTHAPETA-NIMMADA-NARASANNAPETA-SRIKAKULAM-CHILAKAPALEM-SUBHARAPURAM-RANASTHALAM-COSTA-PYDIBHEEMAVAARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V151/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:15:00",
    "ScheduleArrival": "08:45:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP30Z0181",
    "DepotName": "SRIKAKULAM",
    "DriverName": "J R RAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "N041/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "06:30:00",
    "ScheduleArrival": "08:30:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP39Z0372",
    "DepotName": "SRIKAKULAM",
    "DriverName": "S VENKATA RAMANA",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "VOL8/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "06:30:00",
    "ScheduleArrival": "09:15:00",
    "BusType": "PALLEVELUGU",
    "BusNumber": "AP30TA3469",
    "DepotName": "SRIKAKULAM",
    "DriverName": "B H RAO",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "9171/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "06:30:00",
    "ScheduleArrival": "09:00:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP30Z0199",
    "DepotName": "SRIKAKULAM",
    "DriverName": "L GOPI",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V010/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "06:45:00",
    "ScheduleArrival": "08:45:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP40Z0652",
    "DepotName": "SRIKAKULAM",
    "DriverName": "T R BABU",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V006/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "06:50:00",
    "ScheduleArrival": "09:35:00",
    "BusType": "PALLEVELUGU",
    "BusNumber": "AP30Y5697",
    "DepotName": "SRIKAKULAM",
    "DriverName": "B P RAJU",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "N004/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "07:00:00",
    "ScheduleArrival": "09:00:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP35Z0189",
    "DepotName": "SRIKAKULAM",
    "DriverName": "ACHV RAJU",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V137/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "07:10:00",
    "ScheduleArrival": "09:10:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP3WB5000",
    "DepotName": "SRIKAKULAM",
    "DriverName": "R APPANNA",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "3084",
    "Source": "TEKKALI",
    "destination": "RAJAMAHENDRAVARAM",
    "ScheduleDeparture": "05:45:00",
    "ScheduleArrival": "15:00:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP30Z0237",
    "DepotName": "TEKKALI",
    "DriverName": "L GOVINDA RAO",
    "STOPROUTES": "TEKKALI-KOTHAPETA-NIMMADA-NARASANNAPETA-SRIKAKULAM-CHILAKAPALEM-SUBHARAPURAM-RANASTHALAM-COSTA-PYDIBHEEMAVAARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V016/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "07:15:00",
    "ScheduleArrival": "10:00:00",
    "BusType": "ULTRA PALLEVELUGU",
    "BusNumber": "AP39UM157",
    "DepotName": "SRIKAKULAM",
    "DriverName": "K CH RAO",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "N009/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "07:20:00",
    "ScheduleArrival": "09:20:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP39WC1223",
    "DepotName": "SRIKAKULAM",
    "DriverName": "P G RAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "27025",
    "Source": "PARLAKIMIDI",
    "destination": "ANAKAPALLI",
    "ScheduleDeparture": "05:15:00",
    "ScheduleArrival": "11:00:00",
    "BusType": "EXPRESS",
    "BusNumber": "AP31Z0286",
    "DepotName": "ANAKAPALLI",
    "DriverName": "G L KRISHNA",
    "STOPROUTES": "PARLAKIMIDI-PATHAPATNAM-NAVATHALA JN DHANUPURAM-SARAVAKOTA ALDU-CHALLAPETA JN-NARASANNAPETA-SRIKAKULAM-RANASTHALAM-PYDIBHIMAVARAM-TAGARUPUVALSA-ANADAPURAM-VISAKHAPTNAM-OLD GAJUWAKA-KURAMANNAPALEM-ANAKAPALLI",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V024/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "07:30:00",
    "ScheduleArrival": "10:15:00",
    "BusType": "PALLEVELUGU",
    "BusNumber": "AP30TC4991",
    "DepotName": "SRIKAKULAM",
    "DriverName": "L K RAJU",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "9240/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "07:30:00",
    "ScheduleArrival": "09:45:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP30Z0114",
    "DepotName": "SRIKAKULAM",
    "DriverName": "GP RAO",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V161/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "07:30:00",
    "ScheduleArrival": "09:30:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP39WB6478",
    "DepotName": "SRIKAKULAM",
    "DriverName": "A SAIRAJU",
    "STOPROUTES": "SRIKAKULAM-CHILAKAPALEM-SUBHADRAPURAM-RANASTHALAM-PYDIBHEEMAVARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA CAR SHED VSP-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "V282/1",
    "Source": "SRIKAKULAM",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "08:00:00",
    "ScheduleArrival": "10:45:00",
    "BusType": "PALLEVELUGU",
    "BusNumber": "AP30TA2589",
    "DepotName": "SRIKAKULAM",
    "DriverName": "A APPALA RAJU",
    "STOPROUTES": "SRIKAKULAM1-SEEPANNAYUDUPETA-KINTALIMILLI JN.-CHILAKALAPALEM-BUDUMURU-SUBHADRAPURAM-RANASTHALAM-COSTA-PYDIBHIMAVARAM-KANIMETTA-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-SAVARABILLI-POLIPALLE-TAGARAPU VALASA CITYBUS STOP-ANANDAPURAM-BOYAPALEM-MADHURAWADA-ENDADA VILLAGE-HANUMANTHUWAKA-VISAKHAPATNAM",
    "capacity": 50,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  },
  {
    "serviceNO": "IC02/3",
    "Source": "PALASA",
    "destination": "VISAKHAPATNAM",
    "ScheduleDeparture": "05:00:00",
    "ScheduleArrival": "11:00:00",
    "BusType": "ULTRA DELUXE",
    "BusNumber": "AP30123670",
    "DepotName": "PALASA",
    "DriverName": "RAJU",
    "STOPROUTES": "PALASA-TEKKALI-KOTHAPETA-NIMMADA-NARASANNAPETA-SRIKAKULAM-CHILAKAPALEM-SUBHARAPURAM-RANASTHALAM-COSTA-PYDIBHEEMAVAARAM-PUSAPATIREGA-NATHAVALASA-BHOGHAPURAM-TAGARAPUVALASA-ANANDAPURAM-MADHURAWADA-VISAKHAPATNAM",
    "capacity": 45,
    "currentCount": 0,
    "isActive": false,
    "location": null,
    "lastUpdated": null
  }
];

  const uploadBusData = async () => {
    setUploading(true);
    setProgress(0);
    
    try {
      console.log('📤 Starting bus data upload to Firebase...');
      
      const busesRef = ref(database, 'buses');
      
      // Clear existing data first
      await set(busesRef, null);
      console.log('🗑️ Cleared existing bus data');
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Upload buses one by one with progress
      for (let i = 0; i < busData.length; i++) {
        const bus = busData[i];
        
        try {
          // Create a safe bus ID
          const busId = `bus_${bus.BusNumber.replace(/\//g, '_').replace(/\\/g, '_').replace(/\s/g, '_')}`;
          const busRef = ref(database, `buses/${busId}`);
          
          // Ensure all required fields have values
          const safeBusData = {
            ...bus,
            id: busId,
            busId: busId,
            DriverName: bus.DriverName || 'Unknown Driver',
            BusNumber: bus.BusNumber || 'Unknown',
            Source: bus.Source || 'Unknown',
            destination: bus.destination || 'Unknown',
            uploadTimestamp: Date.now()
          };
          
          await set(busRef, safeBusData);
          successCount++;
          
          console.log(`✅ Uploaded bus ${i + 1}/${busData.length}: ${bus.BusNumber}`);
          
        } catch (busError) {
          errorCount++;
          errors.push({ busNumber: bus.BusNumber, error: busError.message });
          console.error(`❌ Failed to upload bus ${bus.BusNumber}:`, busError);
        }
        
        // Update progress
        setProgress(((i + 1) / busData.length) * 100);
        
        // Small delay to avoid overwhelming Firebase
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('🎉 Bus data upload completed!');
      console.log(`📊 Results: ${successCount} successful, ${errorCount} failed`);
      
      Alert.alert(
        'Upload Complete ✅',
        `Successfully uploaded ${successCount} out of ${busData.length} buses.${
          errorCount > 0 ? `\n\nFailed: ${errorCount} buses` : ''
        }${
          errors.length > 0 ? `\n\nErrors: ${errors.map(e => e.busNumber).join(', ')}` : ''
        }`
      );
      
    } catch (error) {
      console.error('❌ Error uploading bus data:', error);
      Alert.alert('Upload Failed', `Failed to upload bus data: ${error.message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const checkFirebaseConnection = async () => {
    try {
      const testRef = ref(database, 'test_connection');
      await set(testRef, { test: true, timestamp: Date.now() });
      Alert.alert('Connection Test', '✅ Firebase connection is working!');
    } catch (error) {
      Alert.alert('Connection Test', `❌ Firebase connection failed: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bus Data Uploader</Text>
      
      <Text style={styles.info}>
        Total Buses: {busData.length}
        {'\n\n'}This will:
        {'\n'}• Clear all existing bus data
        {'\n'}• Upload {busData.length} new buses
        {'\n'}• Overwrite any existing data
      </Text>

      {/* Upload Button */}
      <TouchableOpacity 
        style={[styles.button, styles.uploadButton, uploading && styles.buttonDisabled]}
        onPress={uploadBusData}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? `📤 Uploading... ${Math.round(progress)}%` : '🚌 Upload All Bus Data'}
        </Text>
      </TouchableOpacity>

      {/* Test Connection Button */}
      <TouchableOpacity 
        style={[styles.button, styles.testButton]}
        onPress={checkFirebaseConnection}
      >
        <Text style={styles.buttonText}>🔗 Test Firebase Connection</Text>
      </TouchableOpacity>

      {/* Progress Bar */}
      {uploading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress)}% Complete ({Math.round(progress * busData.length / 100)}/{busData.length} buses)
          </Text>
        </View>
      )}

      {/* Bus List Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Bus Data Preview (First 5):</Text>
        {busData.slice(0, 5).map((bus, index) => (
          <View key={index} style={styles.busPreview}>
            <Text style={styles.busPreviewText}>
              {bus.BusNumber} - {bus.DriverName}
            </Text>
            <Text style={styles.busPreviewRoute}>
              {bus.Source} → {bus.destination}
            </Text>
          </View>
        ))}
        {busData.length > 5 && (
          <Text style={styles.moreText}>... and {busData.length - 5} more buses</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  info: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  previewContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  busPreview: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  busPreviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  busPreviewRoute: {
    fontSize: 12,
    color: '#666',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default BusDataUploader;