/**
 * Seed content for the mentorship hub, shared by /mentorship and the homepage
 * preview cards. Keep this the single source — the two used to hold separate
 * copies of the same offerings and they drifted apart.
 */

export type MentorCategoryKey =
  | "resume_review"
  | "career_conversation"
  | "interview_prep"
  | "referral"
  | "course"
  | "workshop";

export type MentorshipOffering = {
  id: string;
  title: string;
  description: string;
  mentorName: string;
  category: MentorCategoryKey;
  format: string;
  duration: string;
  certified: boolean;
  spots?: number;
};

export type MentorProfile = {
  id: string;
  name: string;
  bio: string;
  location: string;
  tags: string[];
  categories: MentorCategoryKey[];
  certified: boolean;
};

export type MentorReview = {
  id: string;
  author: string;
  role: string;
  offeringTitle: string;
  rating: number;
  quote: string;
};

/** Translation key + English fallback for each category. */
export const CATEGORY_META: Record<MentorCategoryKey, { labelKey: string; fallback: string }> = {
  resume_review: { labelKey: "mentorship.cat_resume", fallback: "Resume Reviews" },
  career_conversation: { labelKey: "mentorship.cat_career", fallback: "Career Conversations" },
  interview_prep: { labelKey: "mentorship.cat_interview", fallback: "Interview Prep" },
  referral: { labelKey: "mentorship.cat_referral", fallback: "Referrals & Intros" },
  course: { labelKey: "mentorship.cat_course", fallback: "Courses & Lessons" },
  workshop: { labelKey: "mentorship.cat_workshop", fallback: "Workshops" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_META) as MentorCategoryKey[];

/** English labels, for surfaces that render outside a translation context. */
export const CATEGORY_LABELS: Record<MentorCategoryKey, string> = Object.fromEntries(
  CATEGORY_KEYS.map((key) => [key, CATEGORY_META[key].fallback])
) as Record<MentorCategoryKey, string>;

export const MENTORSHIP_OFFERINGS: MentorshipOffering[] = [
  {
    id: "offer-1",
    title: "CV & Resume Polish",
    description: "Line-by-line feedback on structure, impact bullets, and ATS readiness from a hiring manager.",
    mentorName: "Amina Hassan",
    category: "resume_review",
    format: "1:1 session",
    duration: "45 min",
    certified: true,
    spots: 8,
  },
  {
    id: "offer-2",
    title: "Career Path Mapping",
    description: "Talk through your next move — internships, first role, or pivot — with someone who has done it.",
    mentorName: "Omar El-Tayeb",
    category: "career_conversation",
    format: "1:1 session",
    duration: "60 min",
    certified: true,
    spots: 6,
  },
  {
    id: "offer-3",
    title: "Technical Interview Prep",
    description: "Mock interviews, system design basics, and feedback tailored to software engineering roles.",
    mentorName: "Yasmin Abdelrahman",
    category: "interview_prep",
    format: "Group cohort",
    duration: "4 weeks",
    certified: true,
    spots: 12,
  },
  {
    id: "offer-4",
    title: "Warm Referral Introduction",
    description: "Get connected to hiring teams or collaborators through a trusted diaspora mentor.",
    mentorName: "Khalid Ibrahim",
    category: "referral",
    format: "Intro request",
    duration: "Async",
    certified: true,
  },
  {
    id: "offer-5",
    title: "Product Management Foundations",
    description: "Self-paced lessons on discovery, roadmaps, and stakeholder communication for aspiring PMs.",
    mentorName: "Nadia Farouk",
    category: "course",
    format: "Mini-course",
    duration: "6 lessons",
    certified: true,
  },
  {
    id: "offer-6",
    title: "LinkedIn & Personal Brand Workshop",
    description: "Build a profile that gets noticed — headline, story, and outreach templates included.",
    mentorName: "Samir Noor",
    category: "workshop",
    format: "Live workshop",
    duration: "90 min",
    certified: true,
    spots: 20,
  },
];

/** Shown until enough real profiles have opted in as mentors. */
export const SEED_MENTORS: MentorProfile[] = [
  {
    id: "mentor-1",
    name: "Amina Hassan",
    bio: "Engineering manager at a fintech in London. Helps makers land their first tech roles.",
    location: "London, UK",
    tags: ["Software", "Hiring", "CV Reviews"],
    categories: ["resume_review", "career_conversation", "referral"],
    certified: true,
  },
  {
    id: "mentor-2",
    name: "Omar El-Tayeb",
    bio: "Product lead with 10+ years across Cairo and Dubai. Passionate about Sudanese talent abroad.",
    location: "Dubai, UAE",
    tags: ["Product", "Strategy", "Career Growth"],
    categories: ["career_conversation", "interview_prep", "course"],
    certified: true,
  },
  {
    id: "mentor-3",
    name: "Yasmin Abdelrahman",
    bio: "Senior engineer and interview coach. Runs mock loops for backend and full-stack roles.",
    location: "Berlin, Germany",
    tags: ["Engineering", "Interviews", "System Design"],
    categories: ["interview_prep", "workshop", "course"],
    certified: true,
  },
  {
    id: "mentor-4",
    name: "Khalid Ibrahim",
    bio: "Startup founder and diaspora connector. Opens doors to collaborators, sponsors, and hiring teams.",
    location: "Toronto, Canada",
    tags: ["Startups", "Referrals", "Networking"],
    categories: ["referral", "career_conversation"],
    certified: true,
  },
];

export const MENTOR_REVIEWS: MentorReview[] = [
  {
    id: "rev-1",
    author: "Huda A.",
    role: "CS student",
    offeringTitle: "CV & Resume Polish",
    rating: 5,
    quote: "My CV went from generic to interview-ready in one session. Clear, kind, and practical.",
  },
  {
    id: "rev-2",
    author: "Mohamed K.",
    role: "Junior developer",
    offeringTitle: "Technical Interview Prep",
    rating: 5,
    quote: "The mock loop felt like a real company interview. I knew exactly what to fix afterward.",
  },
  {
    id: "rev-3",
    author: "Lina S.",
    role: "Product intern",
    offeringTitle: "Career Path Mapping",
    rating: 5,
    quote: "Finally someone who understood the Sudanese diaspora path and gave honest next steps.",
  },
  {
    id: "rev-4",
    author: "Yasir T.",
    role: "Mechanical engineering grad",
    offeringTitle: "Warm Referral Introduction",
    rating: 4,
    quote: "Got a warm intro to a team I would never have reached with cold emails.",
  },
  {
    id: "rev-5",
    author: "Rania M.",
    role: "Designer",
    offeringTitle: "LinkedIn & Personal Brand Workshop",
    rating: 5,
    quote: "Left with a headline, story, and DM templates I actually used the same week.",
  },
  {
    id: "rev-6",
    author: "Amir H.",
    role: "Aspiring PM",
    offeringTitle: "Product Management Foundations",
    rating: 5,
    quote: "Short lessons, real frameworks — perfect before my first PM internship applications.",
  },
];

export type HomeMentorshipCard =
  | { type: "offering"; data: MentorshipOffering }
  | { type: "review"; data: MentorReview };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Two offerings and two reviews in random order for the homepage preview grid.
 * Call this from an effect, never during render — the randomness would not
 * match between the server and client pass.
 */
export function pickHomeMentorshipCards(): HomeMentorshipCard[] {
  const offerings = shuffle(MENTORSHIP_OFFERINGS).slice(0, 2);
  const reviews = shuffle(MENTOR_REVIEWS).slice(0, 2);
  return shuffle([
    ...offerings.map((data) => ({ type: "offering" as const, data })),
    ...reviews.map((data) => ({ type: "review" as const, data })),
  ]);
}
