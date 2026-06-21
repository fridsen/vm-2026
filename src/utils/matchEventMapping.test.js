import { describe, expect, it } from 'vitest';
import {
  isScoringGoalDetail,
  mapApiFootballEvents,
  reconcileRevealEvents,
  rowToRevealEvent,
} from './matchEventMapping.js';

describe('mapApiFootballEvents', () => {
  const homeId = '111';
  const awayId = '222';

  it('maps goals with running score and cards', () => {
    const events = mapApiFootballEvents(
      [
        {
          time: { elapsed: 10 },
          team: { id: 111 },
          player: { name: 'A' },
          type: 'Goal',
          detail: 'Normal Goal',
        },
        {
          time: { elapsed: 55 },
          team: { id: 222 },
          player: { name: 'B' },
          type: 'Card',
          detail: 'Yellow Card',
        },
        {
          time: { elapsed: 80 },
          team: { id: 111 },
          player: { name: 'C' },
          type: 'Goal',
          detail: 'Normal Goal',
        },
      ],
      homeId,
      awayId,
    );

    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({
      type: 'goal',
      team: 'home',
      detail: '1–0',
      player: 'A',
    });
    expect(events[1]).toMatchObject({
      type: 'yellow',
      team: 'away',
      detail: 'Gult kort',
    });
    expect(events[2]).toMatchObject({
      type: 'goal',
      team: 'home',
      detail: '2–0',
    });
  });

  it('ignores missed penalties (api-football type Goal, non-scoring)', () => {
    const events = mapApiFootballEvents(
      [
        {
          time: { elapsed: 10 },
          team: { id: 111 },
          player: { name: 'A' },
          type: 'Goal',
          detail: 'Normal Goal',
        },
        {
          time: { elapsed: 70 },
          team: { id: 111 },
          player: { name: 'B' },
          type: 'Goal',
          detail: 'Missed Penalty',
        },
        {
          time: { elapsed: 80 },
          team: { id: 111 },
          player: { name: 'C' },
          type: 'Goal',
          detail: 'Normal Goal',
        },
      ],
      homeId,
      awayId,
    );

    expect(events).toHaveLength(2);
    expect(events.map((e) => e.detail)).toEqual(['1–0', '2–0']);
  });

  it('maps injury substitutions', () => {
    const events = mapApiFootballEvents(
      [
        {
          time: { elapsed: 40 },
          team: { id: 222 },
          player: { name: 'D' },
          type: 'subst',
          detail: 'Substitution 1',
          comments: 'Injury',
        },
      ],
      homeId,
      awayId,
    );

    expect(events).toEqual([
      {
        minute: 40,
        type: 'injury',
        team: 'away',
        player: 'D',
        detail: 'Bytt ut – skada',
      },
    ]);
  });
});

describe('reconcileRevealEvents', () => {
  it('drops extra goal rows already stored in the database', () => {
    const raw = [
      { minute: 10, type: 'goal', team: 'home', player: 'A', detail: '1–0' },
      { minute: 30, type: 'goal', team: 'home', player: 'B', detail: '2–0' },
      { minute: 50, type: 'goal', team: 'home', player: 'C', detail: '3–0' },
      { minute: 60, type: 'goal', team: 'home', player: 'D', detail: '4–0' },
      { minute: 70, type: 'goal', team: 'home', player: 'E', detail: '5–0' },
    ];

    expect(reconcileRevealEvents(raw, 4, 0).map((e) => e.detail)).toEqual([
      '1–0',
      '2–0',
      '3–0',
      '4–0',
    ]);
  });
});

describe('isScoringGoalDetail', () => {
  it('rejects missed penalties', () => {
    expect(isScoringGoalDetail('Missed Penalty')).toBe(false);
    expect(isScoringGoalDetail('Normal Goal')).toBe(true);
  });
});

describe('rowToRevealEvent', () => {
  it('normalizes db row shape', () => {
    expect(
      rowToRevealEvent({
        minute: 12,
        type: 'goal',
        team_side: 'home',
        player_name: 'X',
        detail: '1–0',
      }),
    ).toEqual({
      minute: 12,
      type: 'goal',
      team: 'home',
      player: 'X',
      detail: '1–0',
    });
  });
});
