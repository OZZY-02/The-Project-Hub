import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ProfileBuilderFields = {
  username?: string | null;
  first_name?: string | null;
  avatar_data_url?: string | null;
  location_country?: string | null;
  location_city?: string | null;
  major_field?: string | null;
  passion_sector?: string | null;
  bio?: string | null;
};

function filled(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

/** Core onboarding fields from profile/create (identity + focus steps). */
export function isProfileComplete(profile: ProfileBuilderFields | null | undefined): boolean {
  if (!profile) return false;
  return (
    filled(profile.first_name) &&
    filled(profile.location_country) &&
    filled(profile.location_city) &&
    filled(profile.major_field) &&
    filled(profile.passion_sector)
  );
}

export function getProfileBuilderHref(
  userId: string | null | undefined,
  profileOrComplete: ProfileBuilderFields | null | undefined | boolean
): string {
  const complete =
    typeof profileOrComplete === "boolean"
      ? profileOrComplete
      : isProfileComplete(profileOrComplete);
  if (!userId || !complete) return "/profile/create";
  return "/profile/settings";
}
