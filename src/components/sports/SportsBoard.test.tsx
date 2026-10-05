import React from 'react';
import {render, screen} from '@testing-library/react';
import {
  SportsBoard,
  projectSportsBoard,
  type SportsViewSource,
} from './SportsBoard';

const url = 'https://example.test/box';
function fact(role: 'score' | 'odds' | 'result', text: string, from: string, until: string) {
  return {role, text, sourceUrl: url, validFrom: from, validUntil: until};
}

const source = (asOf: string): SportsViewSource => ({
  asOf,
  games: [
    {
      occasionId: 'seahawks-49ers|2026-09-30',
      title: 'Seahawks vs 49ers',
      startsAt: '2026-09-30T20:00:00.000Z',
      endsAt: '2026-09-30T23:00:00.000Z',
      facts: [
        fact('odds', 'SEA -3', '2026-09-29T00:00:00.000Z', '2026-09-30T20:00:00.000Z'),
        fact('score', '14-10', '2026-09-30T20:00:00.000Z', '2026-09-30T23:00:00.000Z'),
        fact('result', 'Seahawks won', '2026-09-30T23:00:00.000Z', '2026-10-02T00:00:00.000Z'),
      ],
    },
  ],
  fantasyMatchups: [{leagueName: 'Work', opponent: 'Dave', summary: 'Up 12'}],
});

describe('projectSportsBoard', () => {
  it('shows only odds before kickoff', () => {
    const {games} = projectSportsBoard(source('2026-09-30T19:00:00.000Z'));
    expect(games[0]).toMatchObject({status: 'upcoming', odds: 'SEA -3'});
    expect(games[0].score).toBeUndefined();
  });

  it('shows the live score and drops stale odds', () => {
    const {games} = projectSportsBoard(source('2026-09-30T21:00:00.000Z'));
    expect(games[0]).toMatchObject({status: 'live', score: '14-10'});
    expect(games[0].odds).toBeUndefined();
  });

  it('shows the result after the game and rolls it off later', () => {
    expect(
      projectSportsBoard(source('2026-10-01T00:00:00.000Z')).games[0],
    ).toMatchObject({status: 'final', result: 'Seahawks won'});
    expect(
      projectSportsBoard(source('2026-10-02T00:00:00.000Z')).games[0].result,
    ).toBeUndefined();
  });

  it('carries fantasy matchups through and rejects unknown roles', () => {
    expect(
      projectSportsBoard(source('2026-09-30T21:00:00.000Z')).fantasyMatchups,
    ).toHaveLength(1);
    const bad = source('2026-09-30T21:00:00.000Z');
    (bad.games[0].facts[0] as {role: string}).role = 'weather';
    expect(() => projectSportsBoard(bad)).toThrow();
  });
});

describe('SportsBoard', () => {
  it('renders live score, fantasy matchup, and no stale odds', () => {
    const model = projectSportsBoard(source('2026-09-30T21:00:00.000Z'));
    render(<SportsBoard model={model} />);
    expect(screen.getByText('Seahawks vs 49ers')).toBeTruthy();
    expect(screen.getByText('14-10')).toBeTruthy();
    expect(screen.queryByText('SEA -3')).toBeNull();
    expect(screen.getByText(/Work vs Dave: Up 12/)).toBeTruthy();
  });

  it('renders the empty state', () => {
    render(<SportsBoard model={{games: [], fantasyMatchups: []}} />);
    expect(screen.getByText('No games on your board right now.')).toBeTruthy();
  });
});
