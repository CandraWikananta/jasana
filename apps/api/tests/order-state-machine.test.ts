/**
 * Tabel state machine (State Machine Bagian 2 dan 8, v2.7). Unit murni.
 */

import { describe, expect, it } from 'vitest';
import { OrderStatus } from '@jasana/database';
import {
  ALLOWED_ACTORS,
  ALLOWED_TRANSITIONS,
  ASSIGNEE_ONLY_TRANSITIONS,
  actorAllowedForMode,
} from '@jasana/shared';

/** Bagian 2, ditulis ulang dari tabel dokumen, bukan dari kode. */
const T: Array<[string, string, string]> = [
  ['T1', 'PENDING_ACCEPTANCE->ACCEPTED', 'PROVIDER,WORKER'],
  ['T2', 'PENDING_ACCEPTANCE->REJECTED', 'PROVIDER'],
  ['T3', 'PENDING_ACCEPTANCE->EXPIRED', 'SYSTEM'],
  ['T4', 'PENDING_ACCEPTANCE->CANCELLED', 'CLIENT'],
  ['T5', 'ACCEPTED->PAID', 'SYSTEM'],
  ['T6', 'ACCEPTED->PAYMENT_EXPIRED', 'SYSTEM'],
  ['T7', 'ACCEPTED->CANCELLED', 'CLIENT,PROVIDER'],
  ['T8', 'PAID->ON_THE_WAY', 'WORKER'],
  ['T9', 'PAID->CANCELLED', 'CLIENT,PROVIDER,ADMIN'],
  ['T10', 'ON_THE_WAY->ARRIVED', 'WORKER'],
  ['T11', 'ON_THE_WAY->CANCELLED', 'CLIENT,PROVIDER,ADMIN'],
  ['T12', 'ARRIVED->IN_PROGRESS', 'WORKER'],
  ['T13', 'ARRIVED->DISPUTED', 'CLIENT,PROVIDER'],
  ['T14', 'IN_PROGRESS->AWAITING_VERIFICATION', 'WORKER'],
  ['T15', 'IN_PROGRESS->DISPUTED', 'CLIENT,PROVIDER'],
  ['T16', 'AWAITING_VERIFICATION->COMPLETED', 'WORKER'],
  ['T17', 'AWAITING_VERIFICATION->DISPUTED', 'CLIENT,PROVIDER'],
  ['T18', 'COMPLETED->SETTLED', 'SYSTEM'],
  ['T19', 'COMPLETED->DISPUTED', 'CLIENT,PROVIDER'],
  ['T20', 'DISPUTED->SETTLED', 'ADMIN'],
  ['T21', 'DISPUTED->REFUNDED', 'ADMIN'],
  ['T22', 'CANCELLED->REFUNDED', 'SYSTEM'],
];

describe('ALLOWED_TRANSITIONS dan ALLOWED_ACTORS', () => {
  it('memuat seluruh status enum Prisma, tidak lebih dan tidak kurang', () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual(Object.values(OrderStatus).sort());
  });

  it.each(T)('%s %s sah dengan aktor %s', (_no, key, actors) => {
    const [from, to] = key.split('->') as [keyof typeof ALLOWED_TRANSITIONS, string];
    expect(ALLOWED_TRANSITIONS[from]).toContain(to);
    expect([...(ALLOWED_ACTORS[key] ?? [])].sort()).toEqual(actors.split(',').sort());
  });

  it('tepat 22 transisi, sama di kedua tabel', () => {
    const fromTransitions = Object.entries(ALLOWED_TRANSITIONS).flatMap(([from, tos]) =>
      tos.map((to) => `${from}->${to}`),
    );
    expect(fromTransitions.sort()).toEqual(T.map(([, key]) => key).sort());
    expect(Object.keys(ALLOWED_ACTORS).sort()).toEqual(T.map(([, key]) => key).sort());
  });

  it('lima transisi pelaksanaan hanya untuk WORKER yang ditugaskan', () => {
    expect([...ASSIGNEE_ONLY_TRANSITIONS].sort()).toEqual(
      ['PAID->ON_THE_WAY', 'ON_THE_WAY->ARRIVED', 'ARRIVED->IN_PROGRESS', 'IN_PROGRESS->AWAITING_VERIFICATION', 'AWAITING_VERIFICATION->COMPLETED'].sort(),
    );
    for (const key of ASSIGNEE_ONLY_TRANSITIONS) expect(ALLOWED_ACTORS[key]).toEqual(['WORKER']);
  });

  it('WORKER tidak pernah membatalkan atau membuka sengketa', () => {
    for (const [key, actors] of Object.entries(ALLOWED_ACTORS)) {
      if (key.endsWith('->CANCELLED') || key.endsWith('->DISPUTED')) expect(actors).not.toContain('WORKER');
    }
  });
});

describe('actorAllowedForMode (D70, D102)', () => {
  it('WORKER menerima order hanya pada mode AVAILABLE_NOW', () => {
    expect(actorAllowedForMode('PENDING_ACCEPTANCE->ACCEPTED', 'WORKER', 'SCHEDULED')).toBe(false);
    expect(actorAllowedForMode('PENDING_ACCEPTANCE->ACCEPTED', 'WORKER', 'AVAILABLE_NOW')).toBe(true);
    expect(actorAllowedForMode('PENDING_ACCEPTANCE->ACCEPTED', 'PROVIDER', 'SCHEDULED')).toBe(true);
  });

  it('T2 bukan milik WORKER di kedua mode, ditolak ALLOWED_ACTORS', () => {
    expect(ALLOWED_ACTORS['PENDING_ACCEPTANCE->REJECTED']).toEqual(['PROVIDER']);
  });
});
