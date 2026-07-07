// TypeScript mirror of the native fixtures in
// `TripNextEventLiveActivityFixtures.swift`. Each ContentState replicates the
// same kinds, detail records, titles, flight/travel/next values, and relative
// time anchoring so the lab's computed display tokens match the native review
// renders deterministically.
//
// Native anchors every fixture to `snapshotReferenceNow`
// (Date(timeIntervalSince1970: 1_773_930_660)) and offsets in whole minutes.
// We expose the same reference as LAB_REFERENCE_NOW and a `minutesFromNow`
// helper so renders stay deterministic.

import type { ContentState, DetailRecord } from './contentState';

// Native: TripNextEventLiveActivityFixtures.snapshotReferenceNow.
export const LAB_REFERENCE_NOW = new Date(1_773_930_660 * 1000);

function minutesFromNow(minutes: number): Date {
  return new Date(LAB_REFERENCE_NOW.getTime() + minutes * 60000);
}

// Native explicit absolute anchors for the primary flight-departure fixture.
const flightDepartureReferenceStartAt = new Date(1_773_938_700 * 1000);
const flightDepartureReferenceNextUpAt = new Date(1_773_950_400 * 1000);
const flightDepartureReferenceLeaveByAt = minutesFromNow(22);

// Native scrubber anchors.
const scrubberReferenceStartAt = minutesFromNow(35);
const scrubberReferencePhaseStartAt = minutesFromNow(-25);
const scrubberReferenceNextUpAt = minutesFromNow(80);

function record(
  sourceKey: string,
  label: string,
  value: string,
  valueKind?: DetailRecord['valueKind'],
): DetailRecord {
  return { sourceKey, label, value, valueKind };
}

function makeScrubberState(args: {
  eventKind: string;
  title: string;
  secondaryText: string;
  nextUpTitle: string;
  nextUpEventKind: string;
  nextUpSecondaryText: string;
  details: DetailRecord[];
  actions?: ContentState['actions'];
}): ContentState {
  return {
    primary: {
      kind: args.eventKind,
      title: args.title,
      startAt: scrubberReferenceStartAt,
      secondaryText: args.secondaryText,
      details: args.details,
    },
    next: {
      kind: args.nextUpEventKind,
      title: args.nextUpTitle,
      startAt: scrubberReferenceNextUpAt,
      secondaryText: args.nextUpSecondaryText,
      details: [],
    },
    travel: { driveMinutes: 1 },
    phaseStartAt: scrubberReferencePhaseStartAt,
    actions:
      args.actions ?? [
        {
          id: 'primary',
          title: 'Uber',
          url: 'https://m.uber.com/ul/?action=setPickup&dropoff%5Bformatted_address%5D=1%20Infinite%20Loop',
          icon: 'car.fill',
          style: 'primary',
        },
        {
          id: 'maps',
          title: 'Maps',
          url: 'http://maps.apple.com/?daddr=1+Infinite+Loop',
          icon: 'map.fill',
          style: 'secondary',
        },
      ],
  };
}

export const flightDeparture: ContentState = {
  primary: {
    kind: 'flight_departure',
    title: 'DL 123 to New York',
    startAt: flightDepartureReferenceStartAt,
    secondaryText: 'LAX - JFK',
    details: [
      record('flightLabel', 'Flight', 'DL 123'),
      record('boarding', 'Boarding', '11:30'),
      record('terminal', 'Terminal', '4'),
      record('gate', 'Gate', 'C12'),
      record('seat', 'Seat', '12A'),
      record('drive', 'Drive:', '55m'),
      record('tsa', 'TSA:', '14m'),
      record('weather', 'Weather:', '35'),
    ],
    flight: {
      originAirportCode: 'LAX',
      destinationAirportCode: 'JFK',
      airlineName: 'Delta',
    },
  },
  next: {
    kind: 'hotel_checkin',
    title: 'Hotel check-in',
    startAt: flightDepartureReferenceNextUpAt,
    secondaryText: 'Ritz-Carlton NoMad',
    details: [],
  },
  travel: { driveMinutes: 55, tsaMinutes: 14, leaveByAt: flightDepartureReferenceLeaveByAt },
  actions: [
    {
      id: 'primary',
      title: 'Uber to airport',
      url: 'https://m.uber.com/ul/?action=setPickup',
      icon: 'car.fill',
      style: 'primary',
    },
    {
      id: 'maps',
      title: 'Maps',
      url: 'http://maps.apple.com/?daddr=SFO',
      icon: 'map.fill',
      style: 'secondary',
    },
    {
      id: 'next-event-uber',
      title: 'Uber',
      url: 'https://m.uber.com/ul/?action=setPickup&dropoff%5Bformatted_address%5D=11%20Madison%20Ave',
      icon: 'car.fill',
      style: 'secondary',
    },
    {
      id: 'next-maps',
      title: 'Maps',
      url: 'http://maps.apple.com/?daddr=11+Madison+Ave',
      icon: 'map.fill',
      style: 'secondary',
    },
  ],
};

export const flightDepartureSparse: ContentState = {
  primary: {
    kind: 'flight_departure',
    title: 'DL 4 to LAX',
    startAt: minutesFromNow(65),
    secondaryText: 'JFK - LAX',
    details: [record('flightLabel', 'Flight', 'DL 4'), record('seat', 'Seat', '14A')],
    flight: { originAirportCode: 'JFK', destinationAirportCode: 'LAX', airlineName: 'Delta' },
  },
  actions: [
    {
      id: 'primary',
      title: 'Open',
      url: 'com.packai.app://home?openUpcoming=1',
      icon: 'car.fill',
      style: 'primary',
    },
  ],
};

// WORST-CASE WIDTH stress fixture (mirror of native flightDepartureMaxWidth).
// Widest legal content in every slot so spacing fit is verified: an 8h59m
// countdown (boarding = startAt − 30m), long title/airline, wide gate/terminal,
// 2-char-plus seat, sub-zero weather, long hotel next-up.
export const flightDepartureMaxWidth: ContentState = {
  primary: {
    kind: 'flight_departure',
    title: 'UA 8888 to San Francisco Intl',
    startAt: minutesFromNow(8 * 60 + 59 + 30),
    secondaryText: 'SFO - EWR',
    details: [
      record('flightLabel', 'Flight', 'UA 8888'),
      record('boarding', 'Boarding', '11:30 PM'),
      record('terminal', 'Terminal', '8'),
      record('gate', 'Gate', 'C55'),
      record('seat', 'Seat', '56K'),
      record('drive', 'Drive:', '125m'),
      record('tsa', 'TSA:', '45m'),
      record('weather', 'Weather:', '-15'),
    ],
    flight: { originAirportCode: 'SFO', destinationAirportCode: 'EWR', airlineName: 'United Airlines' },
  },
  next: {
    kind: 'hotel_checkin',
    title: 'The Ritz-Carlton Battery Park',
    startAt: minutesFromNow(8 * 60 + 59 + 30 + 300),
    secondaryText: 'Two West Street, New York, NY 10004',
    details: [],
  },
  travel: {
    driveMinutes: 125,
    tsaMinutes: 45,
    leaveByAt: minutesFromNow(8 * 60 + 59 + 30 - (125 + 45)),
  },
  actions: [
    {
      id: 'primary',
      title: 'Uber to airport',
      url: 'https://m.uber.com/ul/?action=setPickup',
      icon: 'car.fill',
      style: 'primary',
    },
    { id: 'maps', title: 'Maps', url: 'http://maps.apple.com/?daddr=SFO', icon: 'map.fill', style: 'secondary' },
  ],
};

export const flightArrival: ContentState = {
  primary: {
    kind: 'flight_arrival',
    title: 'DL 123',
    startAt: minutesFromNow(62),
    secondaryText: 'LAX - JFK',
    details: [
      record('flightLabel', 'Flight', 'DL 123'),
      record('seat', 'Seat', '12A'),
      record('terminal', 'Terminal', '4'),
      record('gate', 'Gate', 'C12'),
      record('weather', 'Weather:', '35'),
    ],
    flight: { originAirportCode: 'LAX', destinationAirportCode: 'JFK', airlineName: 'Delta' },
  },
  next: {
    kind: 'hotel_checkin',
    title: 'Hotel check-in',
    startAt: minutesFromNow(180),
    secondaryText: 'The TWA Hotel',
    details: [],
  },
  phaseStartAt: minutesFromNow(-90),
  actions: [],
};

export const flightArrivalDelayed: ContentState = {
  primary: {
    kind: 'flight_arrival',
    title: 'AA 12 to JFK',
    startAt: minutesFromNow(130),
    scheduledStartAt: minutesFromNow(100),
    secondaryText: 'LAX - JFK',
    details: [
      record('flightLabel', 'Flight', 'AA 12'),
      record('terminal', 'Terminal', '8'),
      record('weather', 'Weather:', '41'),
    ],
    flight: { originAirportCode: 'LAX', destinationAirportCode: 'JFK', airlineName: 'American Airlines' },
  },
  next: {
    kind: 'hotel_checkin',
    title: 'Hotel check-in',
    startAt: minutesFromNow(240),
    secondaryText: 'Pendry Manhattan West',
    details: [],
  },
  phaseStartAt: minutesFromNow(-120),
  actions: [],
};

export const flightArrived: ContentState = {
  primary: {
    kind: 'flight_arrived',
    title: 'Arrived',
    startAt: minutesFromNow(-10),
    secondaryText: 'JFK - New York',
    details: [
      record('baggage', 'Bag', '7'),
      record('terminal', 'Terminal', '4'),
      record('drive', 'Drive:', '35m'),
      record('weather', 'Weather:', '35'),
    ],
    flight: { originAirportCode: 'LAX', destinationAirportCode: 'JFK', airlineName: 'Delta' },
  },
  next: {
    kind: 'hotel_checkin',
    title: 'The TWA Hotel',
    startAt: minutesFromNow(90),
    secondaryText: 'The TWA Hotel, 1 Idlewild Dr, Queens, NY',
    details: [],
  },
  travel: { driveMinutes: 35 },
  actions: [
    {
      id: 'primary',
      title: 'Uber',
      url: 'https://m.uber.com/ul/?action=setPickup',
      icon: 'car.fill',
      style: 'primary',
    },
    {
      id: 'maps',
      title: 'Maps',
      url: 'http://maps.apple.com/?daddr=1+Idlewild+Dr',
      icon: 'map.fill',
      style: 'secondary',
    },
  ],
};

export const flightArrivedSparse: ContentState = {
  primary: {
    kind: 'flight_arrived',
    title: 'Post flight',
    startAt: minutesFromNow(-5),
    secondaryText: 'ORD - Chicago',
    details: [record('terminal', 'Terminal', '1')],
    flight: { originAirportCode: 'LAX', destinationAirportCode: 'ORD', airlineName: 'United' },
  },
  next: {
    kind: 'hotel_checkin',
    title: 'Hotel check-in',
    startAt: minutesFromNow(70),
    secondaryText: 'The Hoxton Chicago',
    details: [],
  },
  actions: [
    {
      id: 'primary',
      title: 'Uber to hotel',
      url: 'https://m.uber.com/ul/?action=setPickup',
      icon: 'car.fill',
      style: 'primary',
    },
  ],
};

export const hotelCheckIn: ContentState = {
  primary: {
    kind: 'hotel_checkin',
    title: 'The Ritz-Carlton NoMad',
    startAt: minutesFromNow(35),
    secondaryText: 'The Ritz-Carlton NoMad • 11 Madison Ave',
    details: [
      record('confirmation', 'Confirmation', 'ABC123'),
      record('address', 'Address:', '11 Madison Ave'),
      record('drive', 'Drive:', '35m'),
    ],
  },
  next: {
    kind: 'activity',
    title: 'Cocktails at Nubeluz',
    startAt: minutesFromNow(330),
    secondaryText: '11 E 31st St',
    details: [],
  },
  travel: { driveMinutes: 35 },
  actions: [
    {
      id: 'primary',
      title: 'Uber to hotel',
      url: 'https://m.uber.com/ul/?action=setPickup',
      icon: 'car.fill',
      style: 'primary',
    },
    {
      id: 'maps',
      title: 'Maps',
      url: 'http://maps.apple.com/?daddr=11+Madison+Ave',
      icon: 'map.fill',
      style: 'secondary',
    },
  ],
};

export const hotelCheckInNoNavigation: ContentState = {
  primary: {
    kind: 'hotel_checkin',
    title: 'Pendry Manhattan West',
    startAt: minutesFromNow(120),
    secondaryText: '438 W 33rd St, New York, NY',
    details: [record('address', 'Address:', '438 W 33rd St, New York, NY')],
  },
  actions: [
    {
      id: 'primary',
      title: 'Open',
      url: 'com.packai.app://home?openUpcoming=1',
      icon: 'car.fill',
      style: 'primary',
    },
  ],
};

export const activity: ContentState = {
  primary: {
    kind: 'activity',
    title: 'Dinner at Don Angie',
    startAt: minutesFromNow(72),
    secondaryText: '103 Greenwich Ave',
    details: [
      record('address', 'Address:', '103 Greenwich Ave'),
      record('city', 'City', 'New York'),
      record('drive', 'Drive:', '10m'),
    ],
  },
  next: {
    kind: 'hotel_checkin',
    title: 'The Ritz-Carlton NoMad',
    startAt: minutesFromNow(170),
    secondaryText: '11 Madison Ave',
    details: [],
  },
  travel: { driveMinutes: 10 },
  actions: [
    {
      id: 'primary',
      title: 'Uber to dinner',
      url: 'https://m.uber.com/ul/?action=setPickup',
      icon: 'car.fill',
      style: 'primary',
    },
    {
      id: 'maps',
      title: 'Maps',
      url: 'http://maps.apple.com/?daddr=103+Greenwich+Ave',
      icon: 'map.fill',
      style: 'secondary',
    },
    {
      id: 'next-event-uber',
      title: 'Uber',
      url: 'https://m.uber.com/ul/?action=setPickup&dropoff%5Bformatted_address%5D=11%20Madison%20Ave',
      icon: 'car.fill',
      style: 'secondary',
    },
    {
      id: 'next-maps',
      title: 'Maps',
      url: 'http://maps.apple.com/?daddr=11+Madison+Ave',
      icon: 'map.fill',
      style: 'secondary',
    },
  ],
};

export const activityLongTitleNoNavigation: ContentState = {
  primary: {
    kind: 'activity',
    title: 'Dinner with Design Partners at The Modern',
    startAt: minutesFromNow(85),
    secondaryText: '9 W 53rd St, New York, NY',
    details: [record('address', 'Address:', '9 W 53rd St, New York, NY 10019')],
  },
  next: {
    kind: 'flight_departure',
    title: 'Red-eye back to SFO',
    startAt: minutesFromNow(480),
    secondaryText: 'JFK',
    details: [],
  },
  actions: [
    {
      id: 'primary',
      title: 'Open',
      url: 'com.packai.app://home?openUpcoming=1',
      icon: 'car.fill',
      style: 'primary',
    },
  ],
};

export const genericEvent: ContentState = {
  primary: {
    kind: 'generic',
    title: 'Team sync',
    startAt: minutesFromNow(30),
    scheduledStartAt: minutesFromNow(30),
    secondaryText: 'Open Pack for details',
    details: [],
  },
  actions: [
    {
      id: 'open_pack',
      title: 'Open Pack',
      url: 'https://trypackai.com',
      style: 'primary',
    },
  ],
};

export const scrubberActivity: ContentState = makeScrubberState({
  eventKind: 'activity',
  title: 'Scrubber: ViewThatFits',
  secondaryText: '1 Infinite Loop, Cupertino, CA',
  nextUpTitle: 'QA compare hotel scrubber',
  nextUpEventKind: 'hotel_checkin',
  nextUpSecondaryText: '11 Madison Ave',
  details: [record('address', 'Address:', '1 Infinite Loop, Cupertino, CA 95014')],
});

export const scrubberHotel: ContentState = makeScrubberState({
  eventKind: 'hotel_checkin',
  title: 'Scrubber: Fixed Layout',
  secondaryText: 'The Ritz-Carlton NoMad • 11 Madison Ave',
  nextUpTitle: 'Dinner after check-in',
  nextUpEventKind: 'activity',
  nextUpSecondaryText: '103 Greenwich Ave',
  details: [
    record('confirmation', 'Confirmation', 'SCRUB1'),
    record('address', 'Address:', '11 Madison Ave'),
  ],
});

export const scrubberLanded: ContentState = makeScrubberState({
  eventKind: 'activity',
  title: 'Scrubber: Driven Rail',
  secondaryText: '1 Idlewild Dr, Queens, NY 11430',
  nextUpTitle: 'Hotel check-in next',
  nextUpEventKind: 'hotel_checkin',
  nextUpSecondaryText: 'The Ritz-Carlton NoMad, 11 Madison Ave',
  details: [record('address', 'Address:', '1 Idlewild Dr, Queens, NY 11430')],
  actions: [
    {
      id: 'primary',
      title: 'Uber',
      url: 'https://m.uber.com/ul/?action=setPickup&dropoff%5Bformatted_address%5D=1%20Idlewild%20Dr',
      icon: 'car.fill',
      style: 'primary',
    },
    {
      id: 'maps',
      title: 'Maps',
      url: 'http://maps.apple.com/?daddr=1+Idlewild+Dr',
      icon: 'map.fill',
      style: 'secondary',
    },
    {
      id: 'next-event-uber',
      title: 'Uber',
      url: 'https://m.uber.com/ul/?action=setPickup&dropoff%5Bformatted_address%5D=11%20Madison%20Ave',
      icon: 'car.fill',
      style: 'secondary',
    },
  ],
});

// Keyed by the same identifiers the lab uses for each state.
export const LAB_FIXTURES: Record<string, ContentState> = {
  flight_departure: flightDeparture,
  flight_departure_sparse: flightDepartureSparse,
  flight_departure_max_width: flightDepartureMaxWidth,
  flight_arrival: flightArrival,
  flight_arrival_delayed: flightArrivalDelayed,
  flight_arrived: flightArrived,
  flight_arrived_sparse: flightArrivedSparse,
  hotel_checkin: hotelCheckIn,
  hotel_checkin_no_navigation: hotelCheckInNoNavigation,
  activity,
  activity_long_title_no_navigation: activityLongTitleNoNavigation,
  generic_event: genericEvent,
  scrubber_activity: scrubberActivity,
  scrubber_hotel: scrubberHotel,
  scrubber_landed: scrubberLanded,
};

export const LAB_FIXTURE_LIST: { key: string; state: ContentState }[] = Object.entries(
  LAB_FIXTURES,
).map(([key, state]) => ({ key, state }));
