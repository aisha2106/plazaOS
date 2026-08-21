// Module-scoped, not sessionStorage/localStorage: resets on a hard reload
// but persists across client-side navigation within the same load.
let introSeen = false

export function hasSeenIntro(): boolean {
  return introSeen
}

export function markIntroSeen(): void {
  introSeen = true
}
