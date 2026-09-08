import { Suspense, lazy, useMemo } from "react";
import styled from "styled-components";
import {
  Activity,
  Award,
  Calendar,
  Clock,
  Compass,
  Flag,
  Globe,
  Hotel,
  Landmark,
  MapPin,
  Moon,
  Plane,
  TrendingUp,
  Zap,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays, differenceInDays } from "date-fns";
import {
  getAirportByIata,
  getCountryEntryByCode,
  resolveCountryEntry,
} from "@/utils/airportCatalog";
import type { Trip } from "@/api/trips";
import { getTripDistance } from "@/utils/tripMetrics";
import { Card, IconDisc, MicroLabel, PageHeader } from "../ui/Chrome";

type CityVisit = {
  readonly city: string;
  readonly country: string;
  readonly countryCode: string;
  readonly visits: number;
  readonly firstVisit: string;
  readonly lastVisit: string;
  readonly totalDays: number;
};

type CountryVisit = {
  readonly country: string;
  readonly countryCode: string;
  readonly visits: number;
  readonly cities: string[];
  readonly firstVisit: string;
  readonly lastVisit: string;
  readonly totalNights: number;
};

type AirportVisit = {
  readonly iataCode: string;
  readonly name: string;
  readonly city: string;
  readonly country: string;
  readonly state: string;
  readonly visits: number;
};

type HotelVisit = {
  readonly name: string;
  readonly city: string;
  readonly country: string;
  readonly visits: number;
  readonly totalNights: number;
  readonly firstStay: string;
  readonly lastStay: string;
};

const normalizeCountryName = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatLarge = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Math.round(value).toLocaleString();
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveCountryDetails = (
  value?: string | null
): { code: string; name: string; continent?: string } | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  const resolvedCountry =
    resolveCountryEntry(/^[A-Z]{2}$/.test(upper) ? upper : trimmed);

  if (!resolvedCountry) {
    return null;
  }

  return {
    code: resolvedCountry.code,
    name: resolvedCountry.name ?? trimmed,
    continent: resolvedCountry.continentCode ?? undefined,
  };
};

const extractCountryCodesFromText = (value?: string | null): string[] => {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const normalized = normalizeCountryName(value);
  if (!normalized) {
    return [];
  }

  const compact = normalized.replace(/\s+/g, "");
  const matches = new Set<string>();

  const tokenCandidates = normalized.split(" ");
  for (let start = 0; start < tokenCandidates.length; start++) {
    for (let end = start + 1; end <= tokenCandidates.length; end++) {
      const candidate = tokenCandidates.slice(start, end).join(" ");
      const resolved = resolveCountryEntry(candidate);
      if (resolved) {
        matches.add(resolved.code);
      }
    }
  }

  const compactResolved = resolveCountryEntry(compact);
  if (compactResolved) {
    matches.add(compactResolved.code);
  }

  return Array.from(matches);
};

const dayDiff = (start?: string | null, end?: string | null): number => {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) {
    return 0;
  }
  return Math.max(0, differenceInCalendarDays(e, s));
};

const flag = (countryCode: string): string => {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) {
    return "🌍";
  }
  const points = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
};

const formatMonthYear = (value?: string): string => {
  if (!value) {
    return "—";
  }
  const parsed = parseDate(value);
  return parsed ? format(parsed, "MMM yyyy") : "—";
};

interface TravelStatsOverviewProps {
  readonly trips: Trip[];
}

const LazyFlightRouteMap = lazy(async () => {
  const module = await import("./FlightRouteMap");
  return {default: module.FlightRouteMap};
});

export const TravelStatsOverview: React.FC<TravelStatsOverviewProps> = ({ trips }) => {
  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const flightsTotal = trips.reduce((sum, trip) => sum + (trip.flights?.length ?? 0), 0);
    const totalMiles = trips.reduce((sum, trip) => sum + (getTripDistance(trip) ?? 0), 0);
    const totalNights = trips.reduce((sum, trip) => sum + dayDiff(trip.startDate, trip.endDate), 0);
    const totalHotelNights = trips.reduce(
      (sum, trip) =>
        sum +
        (trip.hotels ?? []).reduce(
          (hotelSum, hotel) =>
            hotelSum +
            (typeof hotel.nights === "number"
              ? Math.max(0, hotel.nights)
              : dayDiff(hotel.checkInDate, hotel.checkOutDate)),
          0
        ),
      0
    );

    const cities = new Map<string, CityVisit>();
    const countries = new Map<string, CountryVisit>();
    const airports = new Map<string, AirportVisit>();
    const hotels = new Map<string, HotelVisit>();
    const airlineCounts = new Map<string, number>();
    const continentCodes = new Set<string>();

    let tripsWithHotels = 0;
    let weekendTrips = 0;
    const tripDurations: number[] = [];
    const costsPerDay: number[] = [];
    const bookingLeadTimes: number[] = [];
    const seasonCounts: Record<"Spring" | "Summer" | "Fall" | "Winter", number> = {
      Spring: 0,
      Summer: 0,
      Fall: 0,
      Winter: 0,
    };
    const tripMonths: number[] = [];

    trips.forEach((trip) => {
      const start = parseDate(trip.startDate);
      const nights = dayDiff(trip.startDate, trip.endDate);
      tripDurations.push(nights);

      if (typeof trip.totalCost === "number" && trip.totalCost > 0) {
        costsPerDay.push(trip.totalCost / Math.max(1, nights));
      }

      if (start) {
        const day = start.getDay();
        if (day === 0 || day === 6) {
          weekendTrips += 1;
        }
        const month = start.getMonth();
        tripMonths.push(start.getFullYear() * 12 + month);
        if (month >= 2 && month <= 4) seasonCounts.Spring += 1;
        else if (month >= 5 && month <= 7) seasonCounts.Summer += 1;
        else if (month >= 8 && month <= 10) seasonCounts.Fall += 1;
        else seasonCounts.Winter += 1;
      }

      const bookedAt = parseDate(trip.bookedAt ?? trip.createdAt);
      if (bookedAt && start) {
        bookingLeadTimes.push(Math.max(0, differenceInDays(start, bookedAt)));
      }

      if ((trip.hotels?.length ?? 0) > 0) {
        tripsWithHotels += 1;
      }

      const tripCountryCodes = new Set<string>();

      (trip.flights ?? []).forEach((flight) => {
        if (flight.airline) {
          airlineCounts.set(flight.airline, (airlineCounts.get(flight.airline) ?? 0) + 1);
        }

        [flight.departureAirport, flight.arrivalAirport].forEach((code) => {
          const normalized = code?.trim().toUpperCase();
          if (!normalized) {
            return;
          }
          const airport = getAirportByIata(normalized);
          const countryCode = airport?.countryCode?.toUpperCase() ?? "UN";
          const country = getCountryEntryByCode(countryCode)?.name ?? countryCode;
          const state = airport?.regionCode?.split("-")[1] ?? "";
          const city = airport?.cityName?.trim() ?? "";
          const continent = getCountryEntryByCode(countryCode)?.continentCode ?? undefined;
          if (continent) {
            continentCodes.add(continent);
          }
          if (countryCode && countryCode !== "UN") {
            tripCountryCodes.add(countryCode);
          }

          const existingAirport = airports.get(normalized);
          if (existingAirport) {
            airports.set(normalized, { ...existingAirport, visits: existingAirport.visits + 1 });
          } else {
            airports.set(normalized, {
              iataCode: normalized,
              name: airport?.name ?? normalized,
              city,
              country,
              state,
              visits: 1,
            });
          }

          if (city) {
            const key = `${city}|${countryCode}`;
            const firstDate = trip.startDate ?? trip.endDate ?? "";
            const lastDate = trip.endDate ?? trip.startDate ?? "";
            const existingCity = cities.get(key);
            if (existingCity) {
              cities.set(key, {
                ...existingCity,
                visits: existingCity.visits + 1,
                totalDays: existingCity.totalDays + nights,
                firstVisit: existingCity.firstVisit < firstDate ? existingCity.firstVisit : firstDate,
                lastVisit: existingCity.lastVisit > lastDate ? existingCity.lastVisit : lastDate,
              });
            } else {
              cities.set(key, {
                city,
                country,
                countryCode,
                visits: 1,
                firstVisit: firstDate,
                lastVisit: lastDate,
                totalDays: nights,
              });
            }
          }

          const existingCountry = countries.get(countryCode);
          if (existingCountry) {
            countries.set(countryCode, {
              ...existingCountry,
              visits: existingCountry.visits + 1,
              totalNights: existingCountry.totalNights + nights,
              cities: city ? Array.from(new Set([...existingCountry.cities, city])) : existingCountry.cities,
              firstVisit:
                existingCountry.firstVisit < (trip.startDate ?? existingCountry.firstVisit)
                  ? existingCountry.firstVisit
                  : (trip.startDate ?? existingCountry.firstVisit),
              lastVisit:
                existingCountry.lastVisit > (trip.endDate ?? existingCountry.lastVisit)
                  ? existingCountry.lastVisit
                  : (trip.endDate ?? existingCountry.lastVisit),
            });
          } else {
            countries.set(countryCode, {
              country,
              countryCode,
              visits: 1,
              cities: city ? [city] : [],
              firstVisit: trip.startDate ?? "",
              lastVisit: trip.endDate ?? "",
              totalNights: nights,
            });
          }
        });
      });

      (trip.hotels ?? []).forEach((stay) => {
        const resolvedCountry = resolveCountryDetails(stay.country);
        const countryCode = resolvedCountry?.code ?? "UN";
        const country = resolvedCountry?.name ?? (stay.country?.trim() || countryCode);
        const city = stay.city?.trim() ?? "";
        const hotelNights = typeof stay.nights === "number" ? Math.max(0, stay.nights) : dayDiff(stay.checkInDate, stay.checkOutDate);
        const key = `${stay.name ?? "Hotel"}|${city}|${country}`;
        const firstStay = stay.checkInDate ?? trip.startDate ?? "";
        const lastStay = stay.checkOutDate ?? trip.endDate ?? "";

        if (resolvedCountry?.continent) {
          continentCodes.add(resolvedCountry.continent);
        }
        if (resolvedCountry?.code) {
          tripCountryCodes.add(resolvedCountry.code);
        }

        if (resolvedCountry) {
          const existingCountry = countries.get(countryCode);
          if (existingCountry) {
            countries.set(countryCode, {
              ...existingCountry,
              visits: existingCountry.visits + 1,
              totalNights: existingCountry.totalNights + hotelNights,
              cities: city ? Array.from(new Set([...existingCountry.cities, city])) : existingCountry.cities,
              firstVisit:
                existingCountry.firstVisit < (firstStay || existingCountry.firstVisit)
                  ? existingCountry.firstVisit
                  : (firstStay || existingCountry.firstVisit),
              lastVisit:
                existingCountry.lastVisit > (lastStay || existingCountry.lastVisit)
                  ? existingCountry.lastVisit
                  : (lastStay || existingCountry.lastVisit),
            });
          } else {
            countries.set(countryCode, {
              country,
              countryCode,
              visits: 1,
              cities: city ? [city] : [],
              firstVisit: firstStay,
              lastVisit: lastStay,
              totalNights: hotelNights,
            });
          }
        }

        const existingHotel = hotels.get(key);
        if (existingHotel) {
          hotels.set(key, {
            ...existingHotel,
            visits: existingHotel.visits + 1,
            totalNights: existingHotel.totalNights + hotelNights,
            firstStay: existingHotel.firstStay < firstStay ? existingHotel.firstStay : firstStay,
            lastStay: existingHotel.lastStay > lastStay ? existingHotel.lastStay : lastStay,
          });
        } else {
          hotels.set(key, {
            name: stay.name ?? "Hotel",
            city,
            country,
            visits: 1,
            totalNights: hotelNights,
            firstStay,
            lastStay,
          });
        }
      });

      const inferredCountryCodes = new Set<string>([
        ...extractCountryCodesFromText(trip.title),
        ...extractCountryCodesFromText(trip.description),
        ...extractCountryCodesFromText(trip.notes),
        ...trip.tags.flatMap((tag) => extractCountryCodesFromText(tag)),
      ]);

      inferredCountryCodes.forEach((countryCode) => {
        if (tripCountryCodes.has(countryCode)) {
          return;
        }
        const country = getCountryEntryByCode(countryCode);
        if (!country) {
          return;
        }
        if (country.continentCode) {
          continentCodes.add(country.continentCode);
        }
        countries.set(countryCode, {
          country: country.name ?? countryCode,
          countryCode,
          visits: (countries.get(countryCode)?.visits ?? 0) + 1,
          cities: countries.get(countryCode)?.cities ?? [],
          firstVisit: countries.get(countryCode)?.firstVisit || (trip.startDate ?? ""),
          lastVisit: countries.get(countryCode)?.lastVisit || (trip.endDate ?? ""),
          totalNights: (countries.get(countryCode)?.totalNights ?? 0) + nights,
        });
      });
    });

    const sortedMonthIds = Array.from(new Set(tripMonths)).sort((a, b) => a - b);
    let longestStreak = 0;
    let currentRun = 0;
    for (let i = 0; i < sortedMonthIds.length; i++) {
      if (i === 0 || sortedMonthIds[i] === sortedMonthIds[i - 1] + 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    }
    const currentMonthId = new Date().getFullYear() * 12 + new Date().getMonth();
    let currentStreak = 0;
    let probe = currentMonthId;
    const monthSet = new Set(sortedMonthIds);
    while (monthSet.has(probe)) {
      currentStreak += 1;
      probe -= 1;
    }

    const averageTripDays =
      tripDurations.length > 0
        ? tripDurations.reduce((sum, value) => sum + value, 0) / tripDurations.length
        : 0;
    const medianTripDays =
      tripDurations.length === 0
        ? 0
        : [...tripDurations].sort((a, b) => a - b)[Math.floor(tripDurations.length / 2)];

    const topAirlines = Array.from(airlineCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([airline, flights]) => ({
        airline,
        flights,
        share: flightsTotal > 0 ? (flights / flightsTotal) * 100 : 0,
      }));

    const busiestYearMap = new Map<number, { trips: number; nights: number }>();
    trips.forEach((trip) => {
      const start = parseDate(trip.startDate);
      if (!start) {
        return;
      }
      const year = start.getFullYear();
      const existing = busiestYearMap.get(year) ?? { trips: 0, nights: 0 };
      busiestYearMap.set(year, { trips: existing.trips + 1, nights: existing.nights + dayDiff(trip.startDate, trip.endDate) });
    });
    const busiestYear = Array.from(busiestYearMap.entries()).sort((a, b) => b[1].trips - a[1].trips)[0];

    const longestTrip = trips
      .map((trip) => ({ trip, value: dayDiff(trip.startDate, trip.endDate) }))
      .sort((a, b) => b.value - a.value)[0];
    const mostExpensive = trips
      .map((trip) => ({ trip, value: typeof trip.totalCost === "number" ? trip.totalCost : 0 }))
      .sort((a, b) => b.value - a.value)[0];
    const furthestDistance = trips
      .map((trip) => ({ trip, value: getTripDistance(trip) ?? 0 }))
      .sort((a, b) => b.value - a.value)[0];
    const mostFlightsInTrip = trips
      .map((trip) => ({ trip, value: trip.flights?.length ?? 0 }))
      .sort((a, b) => b.value - a.value)[0];
    const mostHotelNights = trips
      .map((trip) => ({
        trip,
        value: (trip.hotels ?? []).reduce(
          (sum, hotel) =>
            sum +
            (typeof hotel.nights === "number"
              ? Math.max(0, hotel.nights)
              : dayDiff(hotel.checkInDate, hotel.checkOutDate)),
          0
        ),
      }))
      .sort((a, b) => b.value - a.value)[0];
    const longestBookingLead = trips
      .map((trip) => {
        const start = parseDate(trip.startDate);
        const booked = parseDate(trip.bookedAt ?? trip.createdAt);
        return {
          trip,
          value: start && booked ? Math.max(0, differenceInDays(start, booked)) : 0,
        };
      })
      .sort((a, b) => b.value - a.value)[0];
    const favoriteDestination = Array.from(cities.values()).sort((a, b) => b.visits - a.visits)[0];
    const favoriteAirline = topAirlines[0];
    const favoriteAirport = Array.from(airports.values()).sort((a, b) => b.visits - a.visits)[0];

    const seasonTotal = Object.values(seasonCounts).reduce((sum, value) => sum + value, 0);
    const seasonDistribution = (Object.entries(seasonCounts) as Array<[keyof typeof seasonCounts, number]>).map(
      ([season, count]) => ({
        season,
        count,
        percentage: seasonTotal > 0 ? (count / seasonTotal) * 100 : 0,
      })
    );
    const preferredSeason = seasonDistribution.sort((a, b) => b.count - a.count)[0] ?? {
      season: "Spring",
      count: 0,
      percentage: 0,
    };

    const leadTotal = bookingLeadTimes.length;
    const leadBuckets = {
      underOneWeek: bookingLeadTimes.filter((value) => value <= 6).length,
      oneToFourWeeks: bookingLeadTimes.filter((value) => value >= 7 && value <= 29).length,
      oneToThreeMonths: bookingLeadTimes.filter((value) => value >= 30 && value <= 89).length,
      overThreeMonths: bookingLeadTimes.filter((value) => value >= 90).length,
    };
    const avgLead = leadTotal > 0 ? bookingLeadTimes.reduce((sum, v) => sum + v, 0) / leadTotal : 0;
    const medianLead =
      leadTotal > 0
        ? [...bookingLeadTimes].sort((a, b) => a - b)[Math.floor(leadTotal / 2)]
        : 0;

    const avgCostPerDay = costsPerDay.length > 0 ? costsPerDay.reduce((s, v) => s + v, 0) / costsPerDay.length : 0;

    const badges = [
      {
        id: "total-miles",
        title: "Mileage Explorer",
        description: "Total distance across your trips.",
        unit: "mi",
        current: totalMiles,
        thresholds: [1000, 10000, 50000, 150000],
      },
      {
        id: "countries",
        title: "Global Footprint",
        description: "How many countries you have visited.",
        unit: "countries",
        current: countries.size,
        thresholds: [3, 10, 25, 50],
      },
      {
        id: "flights",
        title: "Frequent Flyer",
        description: "Total flights completed.",
        unit: "flights",
        current: flightsTotal,
        thresholds: [10, 25, 75, 150],
      },
      {
        id: "hotel-nights",
        title: "Hotel Hopper",
        description: "Total nights in hotels.",
        unit: "nights",
        current: totalHotelNights,
        thresholds: [10, 30, 90, 180],
      },
    ].map((badge) => {
      const unlockedTierIndex = badge.thresholds.reduce((idx, threshold, currentIndex) => {
        if (badge.current >= threshold) {
          return currentIndex;
        }
        return idx;
      }, -1);
      const nextThreshold = badge.thresholds.find((threshold) => badge.current < threshold);
      const progressToNext =
        nextThreshold == null
          ? 100
          : (badge.current / Math.max(1, nextThreshold)) * 100;
      return {
        ...badge,
        unlockedTierIndex,
        nextThreshold,
        progressToNext: Math.max(0, Math.min(100, progressToNext)),
      };
    });

    return {
      hero: {
        totalMiles,
        totalNights,
        citiesVisited: cities.size,
        countriesVisited: countries.size,
        continentsVisited: Array.from(continentCodes),
        streak: { current: currentStreak, longest: longestStreak },
      },
      activity: {
        totalTrips,
        flightsTotal,
        uniqueAirlines: airlineCounts.size,
        averageFlightsPerTrip: totalTrips > 0 ? flightsTotal / totalTrips : 0,
        averageTripDays,
        medianTripDays,
        timeInAirHours: totalMiles / 515,
        tripsWithHotels,
        tripsWithoutHotels: Math.max(0, totalTrips - tripsWithHotels),
        hotelPercentage: totalTrips > 0 ? (tripsWithHotels / totalTrips) * 100 : 0,
        topAirlines,
      },
      destinations: {
        cities: Array.from(cities.values()),
        countries: Array.from(countries.values()),
        airports: Array.from(airports.values()),
        hotels: Array.from(hotels.values()),
      },
      milestones: {
        longestTrip,
        mostExpensive,
        furthestDistance,
        mostFlightsInTrip,
        mostHotelNights,
        longestBookingLead,
        busiestYear,
        favoriteDestination,
        favoriteAirline,
        favoriteAirport,
      },
      patterns: {
        weekendTrips: weekendTrips,
        weekdayTrips: Math.max(0, totalTrips - weekendTrips),
        weekendPercentage: totalTrips > 0 ? (weekendTrips / totalTrips) * 100 : 0,
        seasonDistribution,
        preferredSeason,
        bookingLead: {
          average: avgLead,
          median: medianLead,
          total: leadTotal,
          bins: [
            { label: "< 1 week", count: leadBuckets.underOneWeek, percentage: leadTotal > 0 ? (leadBuckets.underOneWeek / leadTotal) * 100 : 0 },
            { label: "1-4 weeks", count: leadBuckets.oneToFourWeeks, percentage: leadTotal > 0 ? (leadBuckets.oneToFourWeeks / leadTotal) * 100 : 0 },
            { label: "1-3 months", count: leadBuckets.oneToThreeMonths, percentage: leadTotal > 0 ? (leadBuckets.oneToThreeMonths / leadTotal) * 100 : 0 },
            { label: "3+ months", count: leadBuckets.overThreeMonths, percentage: leadTotal > 0 ? (leadBuckets.overThreeMonths / leadTotal) * 100 : 0 },
          ],
        },
        avgCostPerDay,
      },
      badges,
    };
  }, [trips]);

  return (
    <StatsLayout>
      <Section>
        <PageHeader title="Overview">
          <Compass size={18} />
        </PageHeader>
        <TileGrid>
          <Tile>
            <IconDisc><Compass size={18} /></IconDisc>
            <Metric>
              <StatNumber>{formatLarge(stats.hero.totalMiles)}</StatNumber>
              <MicroLabel>Miles Traveled</MicroLabel>
            </Metric>
          </Tile>
          <Tile>
            <IconDisc><Moon size={18} /></IconDisc>
            <Metric>
              <StatNumber>{formatLarge(stats.hero.totalNights)}</StatNumber>
              <MicroLabel>Nights Away</MicroLabel>
            </Metric>
          </Tile>
          <Tile>
            <IconDisc><MapPin size={18} /></IconDisc>
            <Metric>
              <StatNumber>{stats.hero.citiesVisited}</StatNumber>
              <MicroLabel>Cities ({Math.round((stats.hero.citiesVisited / 100) * 100)}%)</MicroLabel>
            </Metric>
          </Tile>
          <Tile>
            <IconDisc><Flag size={18} /></IconDisc>
            <Metric>
              <StatNumber>{stats.hero.countriesVisited}</StatNumber>
              <MicroLabel>Countries ({Math.round((stats.hero.countriesVisited / 195) * 100)}%)</MicroLabel>
            </Metric>
          </Tile>
          <Tile>
            <IconDisc><Globe size={18} /></IconDisc>
            <Metric>
              <StatNumber>{stats.hero.continentsVisited.length}</StatNumber>
              <MicroLabel>Continents ({Math.round((stats.hero.continentsVisited.length / 7) * 100)}%)</MicroLabel>
            </Metric>
          </Tile>
        </TileGrid>
        <Suspense fallback={<MapLoadingFrame aria-hidden="true" />}>
          <LazyFlightRouteMap
            flights={trips.flatMap((trip) => trip.flights ?? [])}
            visitedCountryCodes={stats.destinations.countries.map((country) => country.countryCode)}
          />
        </Suspense>
        <List>
          {stats.milestones.longestTrip ? (
            <Row>
              <RowKey><Calendar size={14} /> Longest Trip</RowKey>
              <RowValue>{stats.milestones.longestTrip.value} nights • {stats.milestones.longestTrip.trip.title}</RowValue>
            </Row>
          ) : null}
          {stats.milestones.mostExpensive ? (
            <Row>
              <RowKey><Landmark size={14} /> Most Expensive</RowKey>
              <RowValue>{stats.milestones.mostExpensive.value.toLocaleString()} {stats.milestones.mostExpensive.trip.currency ?? "USD"} • {stats.milestones.mostExpensive.trip.title}</RowValue>
            </Row>
          ) : null}
          {stats.milestones.furthestDistance ? (
            <Row>
              <RowKey><Compass size={14} /> Furthest Distance</RowKey>
              <RowValue>{formatLarge(stats.milestones.furthestDistance.value)} mi • {stats.milestones.furthestDistance.trip.title}</RowValue>
            </Row>
          ) : null}
          {stats.milestones.mostFlightsInTrip ? (
            <Row>
              <RowKey><Plane size={14} /> Most Flights</RowKey>
              <RowValue>{stats.milestones.mostFlightsInTrip.value} flights • {stats.milestones.mostFlightsInTrip.trip.title}</RowValue>
            </Row>
          ) : null}
          {stats.milestones.mostHotelNights && stats.milestones.mostHotelNights.value > 0 ? (
            <Row>
              <RowKey><Hotel size={14} /> Most Hotel Nights</RowKey>
              <RowValue>{stats.milestones.mostHotelNights.value} nights • {stats.milestones.mostHotelNights.trip.title}</RowValue>
            </Row>
          ) : null}
          {stats.milestones.busiestYear ? (
            <Row>
              <RowKey><TrendingUp size={14} /> Busiest Year</RowKey>
              <RowValue>{stats.milestones.busiestYear[0]} • {stats.milestones.busiestYear[1].trips} trips • {stats.milestones.busiestYear[1].nights} nights</RowValue>
            </Row>
          ) : null}
          {stats.milestones.longestBookingLead && stats.milestones.longestBookingLead.value > 0 ? (
            <Row>
              <RowKey><Clock size={14} /> Longest Booking Lead</RowKey>
              <RowValue>{stats.milestones.longestBookingLead.value} days ahead • {stats.milestones.longestBookingLead.trip.title}</RowValue>
            </Row>
          ) : null}
          {stats.milestones.favoriteAirline ? (
            <Row>
              <RowKey><Award size={14} /> Favorite Airline</RowKey>
              <RowValue>{stats.milestones.favoriteAirline.airline} • {stats.milestones.favoriteAirline.flights} flights</RowValue>
            </Row>
          ) : null}
          {stats.milestones.favoriteAirport ? (
            <Row>
              <RowKey><MapPin size={14} /> Most Visited Airport</RowKey>
              <RowValue>{stats.milestones.favoriteAirport.iataCode} • {stats.milestones.favoriteAirport.city}{stats.milestones.favoriteAirport.city ? ", " : ""}{stats.milestones.favoriteAirport.country} • {stats.milestones.favoriteAirport.visits} visits</RowValue>
            </Row>
          ) : null}
          {stats.milestones.favoriteDestination ? (
            <Row>
              <RowKey><MapPin size={14} /> Favorite Destination</RowKey>
              <RowValue>{stats.milestones.favoriteDestination.city}, {stats.milestones.favoriteDestination.country} • {stats.milestones.favoriteDestination.visits} visits</RowValue>
            </Row>
          ) : null}
        </List>
        <List>
          <Row>
            <RowKey>Planning Ahead</RowKey>
            <RowValue>Median {Math.round(stats.patterns.bookingLead.median)} days (avg {Math.round(stats.patterns.bookingLead.average)} days)</RowValue>
          </Row>
          {stats.patterns.bookingLead.bins.map((bin) => (
            <Row key={bin.label}>
              <RowKey>{bin.label}</RowKey>
              <RowValue>{bin.count} trips • {bin.percentage.toFixed(0)}%</RowValue>
            </Row>
          ))}
          <Row>
            <RowKey>Hotel Split</RowKey>
            <RowValue>{stats.activity.tripsWithHotels} with hotels • {stats.activity.tripsWithoutHotels} no hotels • {stats.activity.hotelPercentage.toFixed(0)}% with hotels</RowValue>
          </Row>
          <Row>
            <RowKey>Weekend vs Weekday</RowKey>
            <RowValue>{stats.patterns.weekendTrips} weekend • {stats.patterns.weekdayTrips} weekday • {stats.patterns.weekendPercentage.toFixed(0)}% weekend</RowValue>
          </Row>
          <Row>
            <RowKey>Seasonal Split</RowKey>
            <RowValue>{stats.patterns.preferredSeason.season} most common ({stats.patterns.preferredSeason.percentage.toFixed(0)}%)</RowValue>
          </Row>
          <Row>
            <RowKey>Avg Cost / Day</RowKey>
            <RowValue>{stats.patterns.avgCostPerDay > 0 ? `$${Math.round(stats.patterns.avgCostPerDay)}` : "—"}</RowValue>
          </Row>
        </List>
      </Section>

      <Section>
        <PageHeader title="Places">
          <MapPin size={18} />
        </PageHeader>
        <List>
          {stats.destinations.cities
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 8)
            .map((city) => (
              <Row key={`${city.city}-${city.countryCode}`}>
                <RowKey>{flag(city.countryCode)} {city.city}, {city.country}</RowKey>
                <RowValue>{city.visits} visits • {city.totalDays} nights • {formatMonthYear(city.firstVisit)} - {formatMonthYear(city.lastVisit)}</RowValue>
              </Row>
            ))}
        </List>
        <List>
          {stats.destinations.countries
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 8)
            .map((country) => (
              <Row key={country.countryCode}>
                <RowKey>{flag(country.countryCode)} {country.country}</RowKey>
                <RowValue>{country.visits} visits • {country.totalNights} nights • {country.cities.length} cities</RowValue>
              </Row>
            ))}
        </List>
        <List>
          {stats.destinations.airports
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 8)
            .map((airport) => (
              <Row key={airport.iataCode}>
                <RowKey>{airport.iataCode} • {airport.name}</RowKey>
                <RowValue>{airport.city}{airport.city ? ", " : ""}{airport.state} {airport.country} • {airport.visits} visits</RowValue>
              </Row>
            ))}
        </List>
        <List>
          {stats.destinations.hotels
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 8)
            .map((hotel) => (
              <Row key={`${hotel.name}-${hotel.city}-${hotel.country}`}>
                <RowKey><Hotel size={14} /> {hotel.name}</RowKey>
                <RowValue>{hotel.city}{hotel.city ? ", " : ""}{hotel.country} • {hotel.visits} stays • {hotel.totalNights} nights • {formatMonthYear(hotel.firstStay)} - {formatMonthYear(hotel.lastStay)}</RowValue>
              </Row>
            ))}
        </List>
      </Section>

      <Section>
        <PageHeader title="Time in the air">
          <Clock size={18} />
        </PageHeader>
        <TileGrid>
          <Tile>
            <IconDisc><Clock size={18} /></IconDisc>
            <Metric>
              <StatNumber>{Math.round(stats.activity.timeInAirHours)}h</StatNumber>
              <MicroLabel>Hours</MicroLabel>
            </Metric>
          </Tile>
          <Tile>
            <IconDisc><Calendar size={18} /></IconDisc>
            <Metric>
              <StatNumber>{stats.activity.averageTripDays.toFixed(1)}</StatNumber>
              <MicroLabel>Avg Nights / Trip (Median {stats.activity.medianTripDays.toFixed(1)})</MicroLabel>
            </Metric>
          </Tile>
          <Tile>
            <IconDisc><Plane size={18} /></IconDisc>
            <Metric>
              <StatNumber>{stats.activity.averageFlightsPerTrip.toFixed(2)}</StatNumber>
              <MicroLabel>Flights / Trip ({stats.activity.flightsTotal} total)</MicroLabel>
            </Metric>
          </Tile>
          <Tile>
            <IconDisc><Activity size={18} /></IconDisc>
            <Metric>
              <StatNumber>{stats.activity.uniqueAirlines}</StatNumber>
              <MicroLabel>Airlines Flown</MicroLabel>
            </Metric>
          </Tile>
        </TileGrid>
        <List>
          {stats.activity.topAirlines.slice(0, 8).map((airline) => (
            <Row key={airline.airline}>
              <RowKey>{airline.airline}</RowKey>
              <RowValue>{airline.flights} flights • {airline.share.toFixed(1)}% share</RowValue>
            </Row>
          ))}
        </List>
      </Section>

      <Section>
        <PageHeader title="Streaks/Badges">
          <Zap size={18} />
        </PageHeader>
        <TileGrid>
          <Tile>
            <IconDisc><Zap size={18} /></IconDisc>
            <Metric>
              <StatNumber>{stats.hero.streak.longest}</StatNumber>
              <MicroLabel>Longest Month Streak{stats.hero.streak.current > 0 ? ` • Current ${stats.hero.streak.current}` : ""}</MicroLabel>
            </Metric>
          </Tile>
          {stats.badges.map((badge) => {
            const unlocked = badge.unlockedTierIndex >= 0;
            return (
              <BadgeTile key={badge.id} $unlocked={unlocked}>
                <IconDisc>
                  <Award size={18} />
                </IconDisc>
                <Metric>
                  <StatNumber>{badge.current.toFixed(0)}</StatNumber>
                  <MicroLabel>{badge.title} • {unlocked ? `Tier ${badge.unlockedTierIndex + 1}` : "Locked"}</MicroLabel>
                </Metric>
                <BarTrack>
                  <BarFill style={{ width: `${badge.progressToNext}%` }} />
                </BarTrack>
              </BadgeTile>
            );
          })}
        </TileGrid>
      </Section>
    </StatsLayout>
  );
};

const StatsLayout = styled.div`
  display: grid;
  gap: var(--space-3);
`;

const Section = styled(Card).attrs({ as: "section" })`
  padding: var(--space-3);
  display: grid;
  gap: var(--space-3);
`;

const MapLoadingFrame = styled.div`
  min-height: 360px;
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-background-subtle);
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
`;

const Tile = styled.div`
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  padding: var(--space-3);
  display: grid;
  gap: var(--space-2);
`;

const BadgeTile = styled(Tile)<{ $unlocked: boolean }>`
  border-color: ${(props) =>
    props.$unlocked ? "var(--color-success)" : "var(--color-border-medium)"};
  background: ${(props) =>
    props.$unlocked ? "var(--color-success-tint)" : "var(--color-background-subtle)"};
  color: ${(props) =>
    props.$unlocked ? "var(--color-success)" : "var(--color-border-medium)"};
`;

const StatNumber = styled.div`
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
`;

const Metric = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-2);
`;

const List = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const Row = styled.div`
  display: grid;
  gap: var(--space-1);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  background: var(--color-background-subtle);
  padding: var(--space-2) var(--space-3);
`;

const RowKey = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-small);
  color: var(--color-text-primary);
  font-weight: 700;
`;

const RowValue = styled.div`
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
`;

const BarTrack = styled.div`
  margin-top: var(--space-1);
  width: 100%;
  height: var(--space-1);
  background: var(--color-success-tint);
  border-radius: var(--radius-disc);
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  background: var(--color-success);
`;
