import type { PersonalizationVars } from "./types";

/** Replace [name], [N], and [memory] in v1 copy templates. */
export function fillPersonalizationTemplate(
  template: string,
  vars: PersonalizationVars
): string {
  const memory = vars.memory?.trim() ?? "";
  let result = template
    .replace(/\[name\]/g, vars.name)
    .replace(/\[N\]/g, String(vars.days));

  if (memory) {
    result = result.replace(/\[memory\]/g, memory);
  } else {
    result = result
      .replace(/\[memory\]\s*/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return result;
}
