// Mock-data: 48 lag fördelade på 12 grupper A-L.
// WC 2026-kvalet är inte färdigspelat - dessa lag är platshållare.
// Byt ut mot riktig data när FIFA fastställt grupperna.

export const teams = [
  // Grupp A
  { id: 'MEX', name: 'Mexiko', code: 'MEX', flag: '🇲🇽', group: 'A' },
  { id: 'POL', name: 'Polen', code: 'POL', flag: '🇵🇱', group: 'A' },
  { id: 'SEN', name: 'Senegal', code: 'SEN', flag: '🇸🇳', group: 'A' },
  { id: 'UZB', name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿', group: 'A' },

  // Grupp B
  { id: 'CAN', name: 'Kanada', code: 'CAN', flag: '🇨🇦', group: 'B' },
  { id: 'BEL', name: 'Belgien', code: 'BEL', flag: '🇧🇪', group: 'B' },
  { id: 'KSA', name: 'Saudiarabien', code: 'KSA', flag: '🇸🇦', group: 'B' },
  { id: 'IRQ', name: 'Irak', code: 'IRQ', flag: '🇮🇶', group: 'B' },

  // Grupp C
  { id: 'ARG', name: 'Argentina', code: 'ARG', flag: '🇦🇷', group: 'C' },
  { id: 'CRO', name: 'Kroatien', code: 'CRO', flag: '🇭🇷', group: 'C' },
  { id: 'MAR', name: 'Marocko', code: 'MAR', flag: '🇲🇦', group: 'C' },
  { id: 'JOR', name: 'Jordanien', code: 'JOR', flag: '🇯🇴', group: 'C' },

  // Grupp D
  { id: 'USA', name: 'USA', code: 'USA', flag: '🇺🇸', group: 'D' },
  { id: 'GER', name: 'Tyskland', code: 'GER', flag: '🇩🇪', group: 'D' },
  { id: 'KOR', name: 'Sydkorea', code: 'KOR', flag: '🇰🇷', group: 'D' },
  { id: 'JAM', name: 'Jamaica', code: 'JAM', flag: '🇯🇲', group: 'D' },

  // Grupp E
  { id: 'FRA', name: 'Frankrike', code: 'FRA', flag: '🇫🇷', group: 'E' },
  { id: 'URU', name: 'Uruguay', code: 'URU', flag: '🇺🇾', group: 'E' },
  { id: 'EGY', name: 'Egypten', code: 'EGY', flag: '🇪🇬', group: 'E' },
  { id: 'CRC', name: 'Costa Rica', code: 'CRC', flag: '🇨🇷', group: 'E' },

  // Grupp F
  { id: 'ESP', name: 'Spanien', code: 'ESP', flag: '🇪🇸', group: 'F' },
  { id: 'NED', name: 'Nederländerna', code: 'NED', flag: '🇳🇱', group: 'F' },
  { id: 'CIV', name: 'Elfenbenskusten', code: 'CIV', flag: '🇨🇮', group: 'F' },
  { id: 'AUS', name: 'Australien', code: 'AUS', flag: '🇦🇺', group: 'F' },

  // Grupp G
  { id: 'POR', name: 'Portugal', code: 'POR', flag: '🇵🇹', group: 'G' },
  { id: 'SUI', name: 'Schweiz', code: 'SUI', flag: '🇨🇭', group: 'G' },
  { id: 'IRN', name: 'Iran', code: 'IRN', flag: '🇮🇷', group: 'G' },
  { id: 'CPV', name: 'Kap Verde', code: 'CPV', flag: '🇨🇻', group: 'G' },

  // Grupp H
  { id: 'ENG', name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'H' },
  { id: 'DEN', name: 'Danmark', code: 'DEN', flag: '🇩🇰', group: 'H' },
  { id: 'CMR', name: 'Kamerun', code: 'CMR', flag: '🇨🇲', group: 'H' },
  { id: 'PAN', name: 'Panama', code: 'PAN', flag: '🇵🇦', group: 'H' },

  // Grupp I
  { id: 'BRA', name: 'Brasilien', code: 'BRA', flag: '🇧🇷', group: 'I' },
  { id: 'SRB', name: 'Serbien', code: 'SRB', flag: '🇷🇸', group: 'I' },
  { id: 'ALG', name: 'Algeriet', code: 'ALG', flag: '🇩🇿', group: 'I' },
  { id: 'NZL', name: 'Nya Zeeland', code: 'NZL', flag: '🇳🇿', group: 'I' },

  // Grupp J
  { id: 'ITA', name: 'Italien', code: 'ITA', flag: '🇮🇹', group: 'J' },
  { id: 'COL', name: 'Colombia', code: 'COL', flag: '🇨🇴', group: 'J' },
  { id: 'TUN', name: 'Tunisien', code: 'TUN', flag: '🇹🇳', group: 'J' },
  { id: 'QAT', name: 'Qatar', code: 'QAT', flag: '🇶🇦', group: 'J' },

  // Grupp K
  { id: 'NOR', name: 'Norge', code: 'NOR', flag: '🇳🇴', group: 'K' },
  { id: 'JPN', name: 'Japan', code: 'JPN', flag: '🇯🇵', group: 'K' },
  { id: 'NGA', name: 'Nigeria', code: 'NGA', flag: '🇳🇬', group: 'K' },
  { id: 'PAR', name: 'Paraguay', code: 'PAR', flag: '🇵🇾', group: 'K' },

  // Grupp L
  { id: 'TUR', name: 'Turkiet', code: 'TUR', flag: '🇹🇷', group: 'L' },
  { id: 'ECU', name: 'Ecuador', code: 'ECU', flag: '🇪🇨', group: 'L' },
  { id: 'GHA', name: 'Ghana', code: 'GHA', flag: '🇬🇭', group: 'L' },
  { id: 'AUT', name: 'Österrike', code: 'AUT', flag: '🇦🇹', group: 'L' },
];

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function getTeamById(id) {
  return teams.find((t) => t.id === id);
}

export function getTeamsByGroup(group) {
  return teams.filter((t) => t.group === group);
}
