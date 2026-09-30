import React from "react";
import {StyleSheet, Text, View} from "react-native";

import {tokens} from "../../../packages/ui-primitives/src/tokens";
import type {FantasyMatchup, SportsView} from "./projectSportsView";

function providerLabel(provider: FantasyMatchup["provider"]): string {
  if (provider === "espn") {
    return "ESPN";
  }
  if (provider === "yahoo") {
    return "Yahoo";
  }
  return "Sleeper";
}

function GameCard({
  title,
  status,
  score,
  odds,
  result,
}: {
  readonly title: string;
  readonly status: "live" | "upcoming";
  readonly score: string | null;
  readonly odds: string | null;
  readonly result: string | null;
}): React.ReactElement {
  const statusLabel = status === "live" ? "Live" : "Upcoming";
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{statusLabel}</Text>
      <Text style={styles.title}>{title}</Text>
      {score !== null ? <Text style={styles.line}>{score}</Text> : null}
      {odds !== null ? <Text style={styles.line}>{odds}</Text> : null}
      {result !== null ? <Text style={styles.line}>{result}</Text> : null}
    </View>
  );
}

function RecapCard({
  title,
  recap,
}: {
  readonly title: string;
  readonly recap: string;
}): React.ReactElement {
  return (
    <View style={styles.card}>
      <Text style={styles.recap}>{`${title}. ${recap}`}</Text>
    </View>
  );
}

function FantasyCard({matchup}: {readonly matchup: FantasyMatchup}): React.ReactElement {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{providerLabel(matchup.provider)}</Text>
      <Text style={styles.title}>{matchup.leagueName}</Text>
      <Text style={styles.line}>{`${matchup.label} vs ${matchup.opponent}`}</Text>
      <Text style={styles.line}>{`${matchup.myScore}–${matchup.theirScore}`}</Text>
    </View>
  );
}

export function SportsBoard({view}: {readonly view: SportsView}): React.ReactElement {
  const isEmpty =
    view.games.length === 0 &&
    view.recaps.length === 0 &&
    view.fantasyMatchups.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.board}>
        <Text style={styles.empty}>No games for your teams right now.</Text>
      </View>
    );
  }

  return (
    <View style={styles.board}>
      {view.games.length > 0 ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Games
          </Text>
          {view.games.map((game) => (
            <GameCard
              key={game.identityKey}
              title={game.title}
              status={game.status}
              score={game.score}
              odds={game.odds}
              result={game.result}
            />
          ))}
        </View>
      ) : null}
      {view.fantasyMatchups.length > 0 ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Fantasy
          </Text>
          {view.fantasyMatchups.map((matchup) => (
            <FantasyCard key={matchup.id} matchup={matchup} />
          ))}
        </View>
      ) : null}
      {view.recaps.length > 0 ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Results
          </Text>
          {view.recaps.map((recap) => (
            <RecapCard key={recap.identityKey} title={recap.title} recap={recap.recap} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: tokens.spacing.m,
  },
  section: {
    gap: tokens.spacing.s,
  },
  sectionTitle: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: tokens.colors.darkGray2,
    borderColor: tokens.colors.borderSubtle,
    borderRadius: tokens.borderRadius.l,
    borderWidth: 1,
    gap: tokens.spacing.xs,
    padding: tokens.spacing.m,
  },
  kicker: {
    color: tokens.colors.accent,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  title: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSize.m,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  line: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontSize.s,
  },
  recap: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSize.s,
  },
  empty: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontSize.m,
  },
});
