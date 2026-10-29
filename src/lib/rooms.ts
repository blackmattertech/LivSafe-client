import type { RoomConfig, Upload } from "../types";

export function roomsForAssessment(
  assessment: { photoAreas?: RoomConfig[] | null; requestedRooms?: string[] } | null,
  catalog: RoomConfig[],
): RoomConfig[] {
  if (!assessment) return [];
  if (assessment.photoAreas) return assessment.photoAreas;
  const requested = new Set(assessment.requestedRooms ?? []);
  if (!requested.size) return [];
  return catalog.filter((room) => requested.has(room.id));
}

/** Keeps photos for an area that was later removed from the form. */
export function roomsWithUploads(rooms: RoomConfig[], uploads: Pick<Upload, "roomCategory">[]): RoomConfig[] {
  const known = new Set(rooms.map((room) => room.id));
  const extra = [...new Set(uploads.map((file) => file.roomCategory).filter((id) => !known.has(id)))].map(
    (id) => ({
      id,
      label: id.replaceAll("_", " "),
      prompts: [] as string[],
    }),
  );
  return [...rooms, ...extra];
}
