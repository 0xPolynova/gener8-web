export function composeCustomSwapPrompt(userPrompt: string, imageCount: number) {
  const trimmed = userPrompt.trim();
  const extras =
    imageCount > 1
      ? ` Additional people: ${Array.from(
          { length: imageCount - 1 },
          (_, i) => `@Image${i + 2}`,
        ).join(", ")}.`
      : "";
  const binding = `EDIT @Video1. Keep @Video1 as the source video. Preserve its camera, motion, timing, environment, lighting and audio. Replace the person in @Video1 with the person from @Image1.${extras} Take face, hair, body and clothing from the assigned reference image. Ignore the pose, framing and background of the reference photos.`;

  if (!trimmed) return binding;
  if (/@Video1/i.test(trimmed)) return trimmed;
  return `${binding}\n\n${trimmed}`;
}
