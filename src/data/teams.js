// Static team metadata for the FIFA World Cup 2026, keyed to the FIFA codes
// used as ids in the Supabase `teams` table.
//
// Teams and fixtures are synced live from the football data provider; this
// bundle is the fallback the service layer reads for the `group` and `flag`
// fields (the provider supplies neither on the team rows — groups are encoded
// on the fixtures instead). Reflects the official Final Draw (5 Dec 2025).

export const teams = [
  // Grupp A
  { id: 'MEX', name: 'Mexiko', code: 'MEX', flag: '🇲🇽', group: 'A' },
  { id: 'RSA', name: 'Sydafrika', code: 'RSA', flag: '🇿🇦', group: 'A' },
  { id: 'KOR', name: 'Sydkorea', code: 'KOR', flag: '🇰🇷', group: 'A' },
  { id: 'CZE', name: 'Tjeckien', code: 'CZE', flag: '🇨🇿', group: 'A' },

  // Grupp B
  { id: 'CAN', name: 'Kanada', code: 'CAN', flag: '🇨🇦', group: 'B' },
  { id: 'BIH', name: 'Bosnien', code: 'BIH', flag: '🇧🇦', group: 'B' },
  { id: 'QAT', name: 'Qatar', code: 'QAT', flag: '🇶🇦', group: 'B' },
  { id: 'SUI', name: 'Schweiz', code: 'SUI', flag: '🇨🇭', group: 'B' },

  // Grupp C
  { id: 'BRA', name: 'Brasilien', code: 'BRA', flag: '🇧🇷', group: 'C' },
  { id: 'MAR', name: 'Marocko', code: 'MAR', flag: '🇲🇦', group: 'C' },
  { id: 'HAI', name: 'Haiti', code: 'HAI', flag: '🇭🇹', group: 'C' },
  { id: 'SCO', name: 'Skottland', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },

  // Grupp D
  { id: 'USA', name: 'USA', code: 'USA', flag: '🇺🇸', group: 'D' },
  { id: 'PAR', name: 'Paraguay', code: 'PAR', flag: '🇵🇾', group: 'D' },
  { id: 'AUS', name: 'Australien', code: 'AUS', flag: '🇦🇺', group: 'D' },
  { id: 'TUR', name: 'Turkiet', code: 'TUR', flag: '🇹🇷', group: 'D' },

  // Grupp E
  { id: 'GER', name: 'Tyskland', code: 'GER', flag: '🇩🇪', group: 'E' },
  { id: 'CUW', name: 'Curaçao', code: 'CUW', flag: '🇨🇼', group: 'E' },
  { id: 'CIV', name: 'Elfenbenskusten', code: 'CIV', flag: '🇨🇮', group: 'E' },
  { id: 'ECU', name: 'Ecuador', code: 'ECU', flag: '🇪🇨', group: 'E' },

  // Grupp F
  { id: 'NED', name: 'Nederländerna', code: 'NED', flag: '🇳🇱', group: 'F' },
  { id: 'JPN', name: 'Japan', code: 'JPN', flag: '🇯🇵', group: 'F' },
  { id: 'SWE', name: 'Sverige', code: 'SWE', flag: '🇸🇪', group: 'F' },
  { id: 'TUN', name: 'Tunisien', code: 'TUN', flag: '🇹🇳', group: 'F' },

  // Grupp G
  { id: 'BEL', name: 'Belgien', code: 'BEL', flag: '🇧🇪', group: 'G' },
  { id: 'EGY', name: 'Egypten', code: 'EGY', flag: '🇪🇬', group: 'G' },
  { id: 'IRN', name: 'Iran', code: 'IRN', flag: '🇮🇷', group: 'G' },
  { id: 'NZL', name: 'Nya Zeeland', code: 'NZL', flag: '🇳🇿', group: 'G' },

  // Grupp H
  { id: 'ESP', name: 'Spanien', code: 'ESP', flag: '🇪🇸', group: 'H' },
  { id: 'CPV', name: 'Kap Verde', code: 'CPV', flag: '🇨🇻', group: 'H' },
  { id: 'KSA', name: 'Saudiarabien', code: 'KSA', flag: '🇸🇦', group: 'H' },
  { id: 'URY', name: 'Uruguay', code: 'URY', flag: '🇺🇾', group: 'H' },

  // Grupp I
  { id: 'FRA', name: 'Frankrike', code: 'FRA', flag: '🇫🇷', group: 'I' },
  { id: 'SEN', name: 'Senegal', code: 'SEN', flag: '🇸🇳', group: 'I' },
  { id: 'IRQ', name: 'Irak', code: 'IRQ', flag: '🇮🇶', group: 'I' },
  { id: 'NOR', name: 'Norge', code: 'NOR', flag: '🇳🇴', group: 'I' },

  // Grupp J
  { id: 'ARG', name: 'Argentina', code: 'ARG', flag: '🇦🇷', group: 'J' },
  { id: 'ALG', name: 'Algeriet', code: 'ALG', flag: '🇩🇿', group: 'J' },
  { id: 'AUT', name: 'Österrike', code: 'AUT', flag: '🇦🇹', group: 'J' },
  { id: 'JOR', name: 'Jordanien', code: 'JOR', flag: '🇯🇴', group: 'J' },

  // Grupp K
  { id: 'POR', name: 'Portugal', code: 'POR', flag: '🇵🇹', group: 'K' },
  { id: 'COD', name: 'DR Kongo', code: 'COD', flag: '🇨🇩', group: 'K' },
  { id: 'UZB', name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿', group: 'K' },
  { id: 'COL', name: 'Colombia', code: 'COL', flag: '🇨🇴', group: 'K' },

  // Grupp L
  { id: 'ENG', name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  { id: 'CRO', name: 'Kroatien', code: 'CRO', flag: '🇭🇷', group: 'L' },
  { id: 'GHA', name: 'Ghana', code: 'GHA', flag: '🇬🇭', group: 'L' },
  { id: 'PAN', name: 'Panama', code: 'PAN', flag: '🇵🇦', group: 'L' },
];

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function getTeamById(id) {
  return teams.find((t) => t.id === id);
}

export function getTeamsByGroup(group) {
  return teams.filter((t) => t.group === group);
}
