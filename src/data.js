export const MEMBERS = [
  { id: 'machiko', name: 'まちこ', count: 133, hue: 48,  sat: 0.75, wall: 'left',  zOffset: 0 },
  { id: 'miki',    name: '三木',   count: 84,  hue: 22,  sat: 0.70, wall: 'left',  zOffset: 2.6 },
  { id: 'nodari',  name: 'のだり', count: 81,  hue: 5,   sat: 0.65, wall: 'left',  zOffset: 5.2 },
  { id: 'yoko',    name: 'yoko',   count: 69,  hue: 205, sat: 0.60, wall: 'right', zOffset: 0 },
  { id: 'ishige',  name: 'いしげ', count: 29,  hue: 100, sat: 0.55, wall: 'right', zOffset: 2.6 },
  { id: 'skyjung', name: 'skyjung',count: 17,  hue: 140, sat: 0.55, wall: 'right', zOffset: 4.0 },
  { id: 'tera',    name: 'テラ',   count: 7,   hue: 270, sat: 0.50, wall: 'right', zOffset: 5.2 },
  { id: 'node',    name: 'ねで',   count: 7,   hue: 20,  sat: 0.30, wall: 'right', zOffset: 6.2 },
  { id: 'kom',     name: 'kom',    count: 6,   hue: 225, sat: 0.55, wall: 'right', zOffset: 7.2 },
];

export const BLACKBOARD_DATA = {
  title: '図書委員会・読書記録 集計',
  subtitle: '2025年2月度・投稿者別集計（B列のみ）',
  yLabel: '読んだ本の数',
  xLabel: '投稿者（B列）',
  max: 140,
  barColors: [
    '#f5d060', // まちこ: yellow
    '#f5a855', // 三木: orange
    '#f07878', // のだり: pink-red
    '#78c8f5', // yoko: sky blue
    '#90e085', // いしげ: green
    '#68d890', // skyjung: teal-green
    '#c890f0', // テラ: purple
    '#b0b8c0', // ねで: gray
    '#8098f5', // kom: blue-purple
  ],
};
