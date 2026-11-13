// Outline icons in the style of Tabler Icons (MIT), drawn on a 24px grid.
const PATHS = {
  hanger: ['M10 6.5a2 2 0 1 1 3 1.7c-.6 .4 -1 1 -1 1.8v.5', 'M12 10.5l-8.4 5.4c-1 .7 -.6 2.1 .6 2.1h15.6c1.2 0 1.6 -1.4 .6 -2.1z'],
  layers: ['M12 4l8 4l-8 4l-8 -4z', 'M4 12l8 4l8 -4', 'M4 16l8 4l8 -4'],
  inbox: ['M4 13h4l1.5 3h5l1.5 -3h4', 'M4 13l2.5 -7.5h11l2.5 7.5v5a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z'],
  user: ['M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0', 'M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2'],
  refresh: ['M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4', 'M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4'],
  plus: ['M12 5v14', 'M5 12h14'],
  check: ['M5 12l5 5l10 -10'],
  back: ['M5 12h14', 'M5 12l6 6', 'M5 12l6 -6'],
  x: ['M18 6l-12 12', 'M6 6l12 12'],
  camera: ['M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2', 'M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0'],
  edit: ['M4 20h4l10.5 -10.5a2.8 2.8 0 0 0 -4 -4l-10.5 10.5v4', 'M13.5 6.5l4 4'],
  link: ['M9 15l6 -6', 'M11 6l.5 -.5a4 4 0 0 1 5.7 5.7l-.5 .5', 'M13 18l-.4 .5a4 4 0 0 1 -5.7 -5.7l.5 -.5'],
  alert: ['M12 9v4', 'M10.4 3.9l-8.1 13.5a1.9 1.9 0 0 0 1.6 2.8h16.2a1.9 1.9 0 0 0 1.6 -2.8l-8.1 -13.5a1.9 1.9 0 0 0 -3.2 0z', 'M12 16h.01'],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg class="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
