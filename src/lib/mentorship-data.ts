export type MentorCategoryKey =
  | "resume_review"
  | "career_conversation"
  | "interview_prep"
  | "referral"
  | "course"
  | "workshop";

export type MentorshipOfferingPreview = {
  id: string;
  title: string;
  description: string;
  mentorName: string;
  category: MentorCategoryKey;
  format: string;
  duration: string;
  certified?: boolean;
  spots?: number;
};

export type MentorReviewPreview = {
  id: string;
  author: string;
  role: string;
  offeringTitle: string;
  rating: number;
  quote: string;
};

export const CATEGORY_LABELS: Record<MentorCategoryKey, string> = {
  resume_review: "Resume Reviews",
  career_conversation: "Career Conversations",
  interview_prep: "Interview Prep",
  referral: "Referrals & Intros",
  course: "Courses & Lessons",
  workshop: "Workshops",
};

export const PILOT_OFFERINGS: MentorshipOfferingPreview[] = [
  {
    id: "offer-1",
    title: "CV & Resume Polish",
    description: "Line-by-line feedback on structure, impact bullets, and ATS readiness.",
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
    description: "Talk through your next move with someone who has done it.",
    mentorName: "Omar El-Tayeb",
    category: "career_conversation",
    format: "1:1 session",
    duration: "60 min",
  },
  {
    id: "offer-3",
    title: "Technical Interview Prep",
    description: "Mock interviews and feedback tailored to software engineering roles.",
    mentorName: "Yasmin Abdelrahman",
    category: "interview_prep",
    format: "Group cohort",
    duration: "4 weeks",
  },
  {
    id: "offer-4",
    title: "Warm Referral Introduction",
    description: "Get connected to hiring teams through a trusted diaspora mentor.",
    mentorName: "Khalid Ibrahim",
    category: "referral",
    format: "Intro request",
    duration: "Async",
  },
  {
    id: "offer-5",
    title: "Product Management Foundations",
    description: "Lessons on discovery, roadmaps, and stakeholder communication.",
    mentorName: "Nadia Farouk",
    category: "course",
    format: "Mini-course",
    duration: "6 lessons",
  },
  {
    id: "offer-6",
    title: "LinkedIn & Personal Brand Workshop",
    description: "Build a profile that gets noticed with outreach templates included.",
    mentorName: "Samir Noor",
    category: "workshop",
    format: "Live workshop",
    duration: "90 min",
  },
];

export const MENTOR_REVIEWS: MentorReviewPreview[] = [
  {
    id: "rev-1",
    author: "Huda A.",
    role: "CS student, Cairo",
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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickHomeMentorshipCards(): Array<
  | { type: "offering"; data: MentorshipOfferingPreview }
  | { type: "review"; data: MentorReviewPreview }
> {
  const offerings = shuffle(PILOT_OFFERINGS).slice(0, 2);
  const reviews = shuffle(MENTOR_REVIEWS).slice(0, 2);
  return shuffle([
    ...offerings.map((data) => ({ type: "offering" as const, data })),
    ...reviews.map((data) => ({ type: "review" as const, data })),
  ]);
}
