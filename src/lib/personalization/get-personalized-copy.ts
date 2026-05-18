import { pickPrimaryBarrier } from "./barriers";
import { COPY_VARIANTS } from "./copy-variants";
import type { CopyField, PersonalizableUser } from "./types";

export function getPersonalizedCopy(
  user: PersonalizableUser,
  field: CopyField
): string {
  const primary = pickPrimaryBarrier(user.barriers ?? []);
  return COPY_VARIANTS[field][primary];
}
