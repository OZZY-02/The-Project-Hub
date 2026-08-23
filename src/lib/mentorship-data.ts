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

/**
 * An external course, program, or lesson that a mentor has taken and vouches
 * for — not something booked through the platform. "Access" links straight out
 * to the provider; the value we add is the mentor's rating and review.
 */
export type MentorshipOffering = {
  id: string;
  title: string;
  /** Where it lives — edX, Coursera, freeCodeCamp, … */
  provider: string;
  /** External link opened by the Access button. */
  url: string;
  description: string;
  category: MentorCategoryKey;
  format: string;
  duration: string;
  /** Free / paid / audit-free, shown so nobody is surprised by a paywall. */
  cost: string;
  /** The mentor who recommends it, and what they thought. */
  recommendedBy: string;
  rating: number;
  review: string;
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
    id: "offer-solidworks",
    title: "SolidWorks CAD Fundamentals",
    provider: "edX · Dassault Systèmes",
    url: "https://www.edx.org/learn/engineering/dassault-systemes-solidworks-solidworks-cad-fundamentals",
    description: "Part modelling, assemblies, and drawings in SolidWorks, from first sketch to finished part.",
    category: "course",
    format: "Self-paced",
    duration: "6 weeks",
    cost: "Free to audit",
    recommendedBy: "Yasmin Abdelrahman",
    rating: 5,
    review: "The one I point every mechanical grad to. Do the assignments — the certificate matters far less than the parts you end up with in your portfolio.",
  },
  {
    id: "offer-google-ux",
    title: "Google UX Design Certificate",
    provider: "Coursera · Google",
    url: "https://www.coursera.org/professional-certificates/google-ux-design",
    description: "Seven courses covering research, wireframing, prototyping, and building a portfolio in Figma.",
    category: "course",
    format: "Self-paced",
    duration: "6 months",
    cost: "Paid · financial aid available",
    recommendedBy: "Nadia Farouk",
    rating: 4,
    review: "Genuinely good on process and it hands you three portfolio pieces. Apply for financial aid rather than paying full price — it is nearly always approved.",
  },
  {
    id: "offer-fcc-web",
    title: "Responsive Web Design",
    provider: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    description: "HTML and CSS from scratch through projects, ending in a certification.",
    category: "course",
    format: "Self-paced",
    duration: "~300 hours",
    cost: "Free",
    recommendedBy: "Amina Hassan",
    rating: 5,
    review: "Completely free with no catch, and project-based rather than video-based. Best possible starting point if you have never written a line of code.",
  },
  {
    id: "offer-cs50",
    title: "CS50x: Introduction to Computer Science",
    provider: "Harvard",
    url: "https://cs50.harvard.edu/x/",
    description: "Harvard's introduction to computer science — C, Python, SQL, and web fundamentals.",
    category: "interview_prep",
    format: "Self-paced",
    duration: "11 weeks",
    cost: "Free",
    recommendedBy: "Yasmin Abdelrahman",
    rating: 5,
    review: "Hard, and worth it. The problem sets are the closest thing to real interview pressure you will find for free.",
  },
  {
    id: "offer-ml",
    title: "Machine Learning Specialization",
    provider: "Coursera · DeepLearning.AI",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    description: "Andrew Ng's rebuilt ML series: supervised learning, neural networks, and practical advice.",
    category: "course",
    format: "Self-paced",
    duration: "2 months",
    cost: "Paid · audit free",
    recommendedBy: "Omar El-Tayeb",
    rating: 4,
    review: "Still the clearest explanation of the fundamentals anywhere. Audit it free if the certificate is not the point for you.",
  },
  {
    id: "offer-financial-markets",
    title: "Financial Markets",
    provider: "Coursera · Yale",
    url: "https://www.coursera.org/learn/financial-markets-global",
    description: "Robert Shiller on risk, insurance, and how financial institutions actually behave.",
    category: "career_conversation",
    format: "Self-paced",
    duration: "7 weeks",
    cost: "Free to audit",
    recommendedBy: "Khalid Ibrahim",
    rating: 4,
    review: "More about judgement than mechanics. Useful before any fintech interview, and it makes you better at reading the news.",
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
