import type { ReactNode } from "react";
import {
  BadgeCheck,
  Brain,
  Calendar,
  Clock,
  Link2,
  Map as MapIcon,
  PlaneTakeoff,
  Receipt,
  RefreshCw,
  Share2,
  Shield,
  Smartphone,
  UserRound,
} from "lucide-react";
import type { CapabilityPageSlug } from "@/content/capabilityPages";

/**
 * One icon per capability page — shared by the features showcase's capability
 * cards and the capability pages' tab band, so a capability always wears the
 * same icon wherever it appears.
 */
export const capabilityIcons: Record<CapabilityPageSlug, ReactNode> = {
  "travel-history": <Brain />,
  "travel-stats": <MapIcon />,
  "loyalty-details": <BadgeCheck />,
  "trip-planning-from-events": <Calendar />,
  "trip-updates": <RefreshCw />,
  "travel-booking": <PlaneTakeoff />,
  "upcoming-trip-details": <Clock />,
  "airport-security-wait-times": <Shield />,
  "trip-calendar-sync": <Calendar />,
  "connected-accounts": <Link2 />,
  "traveler-profiles": <UserRound />,
  "trip-sharing": <Share2 />,
  "live-trip-views": <Smartphone />,
  "trip-expenses": <Receipt />,
};
