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

export function isProfileComplete(profile: ProfileBuilderFields | null | undefined): boolean {
  return Boolean(
    profile &&
      (profile.username ||
        profile.first_name ||
        profile.avatar_data_url ||
        profile.location_country ||
        profile.location_city ||
        profile.major_field ||
        profile.passion_sector ||
        profile.bio)
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
