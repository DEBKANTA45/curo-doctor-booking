import specialties from "@/data/specialties.json";

export interface ChatAction {
  label: string;
  href: string;
}

export interface ChatReply {
  text: string;
  actions?: ChatAction[];
  isEmergency?: boolean;
}

// ---------- Emergency / crisis detection (checked first, always) ----------

const EMERGENCY_KEYWORDS = [
  "chest pain",
  "can't breathe",
  "cant breathe",
  "difficulty breathing",
  "shortness of breath",
  "severe bleeding",
  "heavy bleeding",
  "unconscious",
  "unresponsive",
  "stroke",
  "face drooping",
  "slurred speech",
  "seizure",
  "poisoned",
  "overdose",
  "heart attack",
  "not breathing",
  "choking",
];

const CRISIS_KEYWORDS = [
  "kill myself",
  "suicide",
  "suicidal",
  "end my life",
  "want to die",
  "harm myself",
  "hurt myself",
  "self harm",
  "self-harm",
];

function containsAny(text: string, list: string[]) {
  return list.some((kw) => text.includes(kw));
}

// ---------- App-help topics (role-aware) ----------

interface Topic {
  keywords: string[];
  reply: ChatReply;
}

// Topics only relevant to patients — checked when role is "patient" or unknown/logged out.
const PATIENT_TOPICS: Topic[] = [
  {
    keywords: ["book appointment", "book a doctor", "how to book", "make an appointment", "schedule appointment"],
    reply: {
      text: "To book an appointment: go to Find Doctors, pick a specialty or search by name/city, open a doctor's profile, and choose an available slot on the Book page. You'll need to be logged in as a patient first.",
      actions: [{ label: "Find Doctors", href: "/doctors" }],
    },
  },
  {
    keywords: ["cancel appointment", "cancel my booking", "cancel booking"],
    reply: {
      text: "You can cancel an upcoming appointment from the My Appointments page — open the appointment and use the cancel option there.",
      actions: [{ label: "My Appointments", href: "/appointments" }],
    },
  },
  {
    keywords: ["reschedule"],
    reply: {
      text: "This version doesn't support editing a booked slot directly — cancel the existing appointment from My Appointments, then book a new slot with the doctor.",
      actions: [{ label: "My Appointments", href: "/appointments" }],
    },
  },
  {
    keywords: ["find doctor", "search doctor", "list of doctors", "which doctor", "recommend a doctor"],
    reply: {
      text: "You can browse all doctors and filter by specialty or city on the Find Doctors page.",
      actions: [{ label: "Find Doctors", href: "/doctors" }],
    },
  },
  {
    keywords: ["video consult", "online consult", "video call with doctor", "e-consult"],
    reply: {
      text: "Once a doctor starts your consultation, you can join it from your appointment details in My Appointments.",
      actions: [{ label: "My Appointments", href: "/appointments" }],
    },
  },
  {
    keywords: ["profile", "update my details", "edit profile", "medical history", "allergies", "blood group", "emergency contact"],
    reply: {
      text: "You can update your personal and medical details — like allergies, blood group, and current medications — on your Profile page.",
      actions: [{ label: "My Profile", href: "/profile" }],
    },
  },
];

// Topics only relevant to doctors — checked when role is "doctor".
const DOCTOR_TOPICS: Topic[] = [
  {
    keywords: ["doctor dashboard", "dashboard", "my schedule", "manage schedule", "doctor schedule"],
    reply: {
      text: "You can manage availability from the Schedule page and see upcoming patients on the Dashboard.",
      actions: [
        { label: "Dashboard", href: "/doctor/dashboard" },
        { label: "Schedule", href: "/doctor/schedule" },
      ],
    },
  },
  {
    keywords: [
      "reschedule",
      "change my slot",
      "change slot",
      "edit slot",
      "block a slot",
      "update availability",
      "change availability",
      "update slot",
      "add slot",
      "remove slot",
      "slot timing",
    ],
    reply: {
      text: "You can add, edit, or block out time slots from the Schedule page — set your available days and time ranges there, and it'll reflect on your public profile for patients booking with you.",
      actions: [{ label: "Go to Schedule", href: "/doctor/schedule" }],
    },
  },
  {
    keywords: ["profile", "update my profile", "edit my profile", "doctor details", "consultation fee", "update fee", "change fee", "clinic name", "update qualification"],
    reply: {
      text: "You can update your doctor profile — like clinic name, consultation fee, qualifications, and about section — from the Doctor Profile page.",
      actions: [{ label: "Doctor Profile", href: "/doctor/profile" }],
    },
  },
  {
    keywords: ["my patients", "patient list", "upcoming patients", "today's appointments", "consult a patient", "start consultation"],
    reply: {
      text: "Your upcoming and today's patient appointments show up on the Dashboard. Opening an appointment from there lets you start the consultation.",
      actions: [{ label: "Doctor Dashboard", href: "/doctor/dashboard" }],
    },
  },
];

// Topics that apply regardless of role (or when logged out).
const COMMON_TOPICS: Topic[] = [
  {
    keywords: ["sign up", "register", "create account"],
    reply: {
      text: "Patients can sign up from the Register page. Doctors have a separate registration flow under the doctor login area.",
      actions: [
        { label: "Patient Sign up", href: "/register" },
        { label: "Doctor Sign up", href: "/doctor/register" },
      ],
    },
  },
  {
    keywords: ["log in", "login", "sign in"],
    reply: {
      text: "Patients log in from the Login page. Doctors have their own login page.",
      actions: [
        { label: "Patient Login", href: "/login" },
        { label: "Doctor Login", href: "/doctor/login" },
      ],
    },
  },
  {
    keywords: ["notification", "unread", "bell icon"],
    reply: {
      text: "Notifications (like appointment confirmations or updates) show up under the bell icon in the navbar, and a full list is on your Appointments page.",
    },
  },
];

// ---------- Medical symptom -> specialty mapping ----------

interface SymptomTopic {
  keywords: string[];
  specialtyId: string;
  note: string;
}

const SYMPTOM_TOPICS: SymptomTopic[] = [
  {
    keywords: ["fever", "cold", "cough", "flu", "body ache", "sore throat", "weakness", "tired all the time"],
    specialtyId: "general-physician",
    note: "General, everyday symptoms like fever, cough, or body aches are usually a good fit for a General Physician, who can assess you and refer you onward if needed.",
  },
  {
    keywords: ["rash", "acne", "pimple", "skin", "itching", "hives", "eczema", "hair fall", "dandruff"],
    specialtyId: "dermatologist",
    note: "Skin, hair, and nail concerns are typically handled by a Dermatologist.",
  },
  {
    keywords: ["baby", "infant", "toddler", "child fever", "my kid", "my son", "my daughter", "vaccination schedule"],
    specialtyId: "pediatrician",
    note: "For concerns about a baby or young child's health, a Pediatrician is the right specialist.",
  },
  {
    keywords: ["pregnan", "period", "menstrual", "pcos", "pcod", "gynec"],
    specialtyId: "gynecologist",
    note: "Pregnancy, menstrual, and women's health concerns are best discussed with a Gynecologist.",
  },
  {
    keywords: ["tooth", "toothache", "gum", "cavity", "dental"],
    specialtyId: "dentist",
    note: "Tooth, gum, and oral health concerns should go to a Dentist.",
  },
  {
    keywords: ["heart", "chest tightness", "palpitation", "blood pressure", "bp", "cholesterol"],
    specialtyId: "cardiologist",
    note: "Heart-related and blood pressure concerns are handled by a Cardiologist.",
  },
  {
    keywords: ["bone", "joint", "fracture", "sprain", "back pain", "knee pain", "shoulder pain", "arthritis"],
    specialtyId: "orthopedic",
    note: "Bone, joint, and injury-related pain is usually seen by an Orthopedic specialist.",
  },
  {
    keywords: ["ear pain", "hearing", "nose block", "sinus", "throat pain", "tonsil"],
    specialtyId: "ent-specialist",
    note: "Ear, nose, and throat concerns are handled by an ENT Specialist.",
  },
  {
    keywords: ["anxiety", "depression", "stress", "panic attack", "can't sleep", "insomnia", "mental health", "mood"],
    specialtyId: "psychiatrist",
    note: "For anxiety, low mood, or other mental health concerns, a Psychiatrist can help — and reaching out is a strong first step.",
  },
  {
    keywords: ["eye", "vision", "blurry", "eyesight", "red eye"],
    specialtyId: "ophthalmologist",
    note: "Eye and vision concerns are handled by an Ophthalmologist.",
  },
];

const WELLNESS_TOPICS: Topic[] = [
  {
    keywords: ["stay healthy", "healthy tips", "general health", "wellness tips"],
    reply: {
      text: "A few general habits that support overall health: regular sleep (7–9 hours for most adults), staying hydrated, balanced meals with vegetables and protein, regular movement, and routine checkups. This is general wellness information, not a treatment plan — for anything specific to you, a doctor on Curo can advise properly.",
    },
  },
  {
    keywords: ["diet", "nutrition", "what should i eat"],
    reply: {
      text: "General nutrition guidance usually points to a varied diet with vegetables, fruit, whole grains, and lean protein, plus limiting heavily processed food. For a diet plan tailored to a specific condition or goal, a General Physician or dietitian would give safer, personalized guidance.",
    },
  },
  {
    keywords: ["exercise", "workout tips", "how much exercise"],
    reply: {
      text: "General activity guidelines suggest around 150 minutes of moderate exercise a week for most healthy adults, plus some strength training. If you have an existing condition or injury, check with a doctor before starting a new routine.",
    },
  },
  {
    keywords: ["sleep tips", "how to sleep better"],
    reply: {
      text: "Good sleep habits generally include a consistent sleep schedule, limiting screens and caffeine before bed, and keeping the room cool and dark. If sleep problems persist, that's worth discussing with a doctor.",
    },
  },
];

const GREETINGS = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
const THANKS = ["thank you", "thanks", "thank u", "thx"];

// ---------- Main matcher ----------

export function getSpecialtyName(id: string): string {
  return specialties.find((s) => s.id === id)?.name ?? "specialist";
}

export function generateReply(rawInput: string, role: "patient" | "doctor" | null = null): ChatReply {
  const text = rawInput.trim().toLowerCase();

  if (!text) {
    return { text: "Go ahead and type your question — I'm here to help with health questions and using Curo." };
  }

  // 1. Crisis check — always takes priority
  if (containsAny(text, CRISIS_KEYWORDS)) {
    return {
      isEmergency: true,
      text:
        "I'm really sorry you're going through this. I'm not able to help with this directly, but please reach out right now to a crisis line or someone you trust. In India, you can call the KIRAN mental health helpline at 1800-599-0019 (24/7, toll-free). If you're outside India, please contact your local emergency number or a local crisis line. If you're in immediate danger, please call your local emergency services or go to the nearest emergency room.",
    };
  }

  // 2. Medical emergency check
  if (containsAny(text, EMERGENCY_KEYWORDS)) {
    return {
      isEmergency: true,
      text:
        "This sounds like it could be a medical emergency. Please call your local emergency number or go to the nearest emergency room right away — this chatbot isn't able to help with urgent or emergency situations.",
    };
  }

  // 3. Greetings / thanks
  if (containsAny(text, GREETINGS) && text.length < 30) {
    return {
      text: "Hi! I can help with general medical questions and using the Curo app — like finding the right specialist or booking an appointment. What's on your mind?",
    };
  }
  if (containsAny(text, THANKS)) {
    return { text: "You're welcome! Anything else I can help with — health-related or about using Curo?" };
  }

  // 4. Role-specific app-help topics first, so patient/doctor language never crosses over
  const roleTopics = role === "doctor" ? DOCTOR_TOPICS : PATIENT_TOPICS;
  for (const topic of roleTopics) {
    if (containsAny(text, topic.keywords)) {
      return topic.reply;
    }
  }

  // 5. Common topics (login/register/notifications) regardless of role
  for (const topic of COMMON_TOPICS) {
    if (containsAny(text, topic.keywords)) {
      return topic.reply;
    }
  }

  // 6. Symptom -> specialty suggestions
  for (const topic of SYMPTOM_TOPICS) {
    if (containsAny(text, topic.keywords)) {
      return {
        text: `${topic.note} I can't diagnose or prescribe anything, but you can book a consultation directly on Curo.`,
        actions: [
          {
            label: `Find a ${getSpecialtyName(topic.specialtyId)}`,
            href: `/doctors?specialty=${topic.specialtyId}`,
          },
        ],
      };
    }
  }

  // 7. General wellness topics
  for (const topic of WELLNESS_TOPICS) {
    if (containsAny(text, topic.keywords)) {
      return topic.reply;
    }
  }

  // 8. Detect if it's at least health-adjacent but unmatched
  const healthHints = ["pain", "hurt", "symptom", "sick", "ill", "medicine", "doctor", "health", "treatment", "disease"];
  if (containsAny(text, healthHints)) {
    return {
      text:
        "Thanks for sharing that. I can't diagnose specific symptoms, but I can help point you to the right specialist on Curo, or answer general health questions. Could you tell me a bit more about what you're experiencing, or would you like to browse doctors by specialty?",
      actions: [{ label: "Browse specialties", href: "/doctors" }],
    };
  }

  // 9. Off-topic — decline politely and redirect
  return {
    text:
      "I'm built to help only with general medical questions and using the Curo app — like finding a specialist, booking appointments, or general wellness tips. I can't help with topics outside that. Is there something health-related or app-related I can help with?",
  };
}