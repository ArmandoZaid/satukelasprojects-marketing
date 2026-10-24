const paths: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  school: <><path d="m3 9 9-6 9 6M5 9v12h14V9M9 21v-7h6v7M9 10h6"/></>,
  pipeline: <><rect x="3" y="4" width="5" height="16"/><rect x="10" y="4" width="5" height="10"/><rect x="17" y="4" width="5" height="13"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 2v5m8-5v5m-9 8 3 3 7-6"/></>,
  chart: <path d="M4 3v18h18M8 17v-5m5 5V8m5 9V4"/>,
  settings: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8l8 8m0-8-8 8"/></>,
  plus: <path d="M12 4v16M4 12h16"/>, arrow: <path d="M4 12h16m-5-5 5 5-5 5"/>,
  menu: <path d="M3 6h18M3 12h18M3 18h18"/>, close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 5 5 10-10"/>, exit: <path d="M10 4H4v16h6m0-8h12m-5-5 5 5-5 5"/>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  key: <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3"/></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
};
export function Icon({ name }: { name: string }) { return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.grid}</svg>; }
