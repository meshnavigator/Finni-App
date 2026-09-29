/** Keep catalog IDs and saved records canonical; personalize only visible copy. */
export function petCatalogText(text: string, petName: string): string {
  return text
    .replaceAll('для Финни', `для питомца «${petName}»`)
    .replaceAll('за Финни', `за питомцем «${petName}»`)
    .replaceAll('Финни', `Питомец «${petName}»`);
}

/** Saved day summaries keep their original wording; use the current profile name on screen. */
export function petNarrativeText(text: string, petName: string): string {
  return text
    .replaceAll('о Финни', `о питомце «${petName}»`)
    .replaceAll('Финни', `Питомец «${petName}»`);
}
