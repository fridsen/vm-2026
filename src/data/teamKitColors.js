// Primary kit accent for leaderboard match rows (Figma team color bar).

const KIT = {
  ALG: '#006233',
  ARG: '#74ACDF',
  AUS: '#FFCD00',
  AUT: '#ED2939',
  BEL: '#FAE042',
  BIH: '#002395',
  BRA: '#009b3a',
  CAN: '#FF0000',
  CIV: '#F77F00',
  COD: '#007FFF',
  COL: '#FCD116',
  CPV: '#003893',
  CRO: '#FF0000',
  CUW: '#002B7F',
  CZE: '#11457E',
  ECU: '#FFD100',
  EGY: '#CE1126',
  ENG: '#FFFFFF',
  ESP: '#AA151B',
  FRA: '#0055A4',
  GER: '#000000',
  GHA: '#006B3F',
  HAI: '#00209F',
  IRN: '#239F40',
  IRQ: '#CE1126',
  JOR: '#007A3D',
  JPN: '#BC002D',
  KOR: '#CD2E3A',
  MAR: '#C1272D',
  MEX: '#006847',
  NED: '#FF6600',
  NOR: '#BA0C2F',
  NZL: '#000000',
  PAN: '#DA121A',
  PAR: '#D52B1E',
  POR: '#006600',
  QAT: '#8A1538',
  RSA: '#007A4D',
  SCO: '#005EB8',
  SEN: '#00853F',
  SUI: '#FF0000',
  SWE: '#006AA7',
  TUN: '#E70013',
  TUR: '#E30A17',
  URY: '#0038A8',
  USA: '#3C3B6E',
  UZB: '#1EB53A',
};

const DEFAULT = '#94a3b8';

export function kitColorForCode(code) {
  if (!code) return DEFAULT;
  return KIT[code.toUpperCase()] ?? DEFAULT;
}
