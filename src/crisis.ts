export const crisisLines: Record<string, { name: string; numbers: string[] }> = {
  "Philippines": {
    name: "Philippines",
    numbers: ["(02) 8804-4673", "0917-558-4673", "0939-152-8389"],
  },
  "US": {
    name: "United States",
    numbers: ["988 (Suicide & Crisis Lifeline)"],
  },
  "UK": {
    name: "United Kingdom",
    numbers: ["111 (NHS Mental Health)", "0800 689 5652 (Samaritans)"],
  },
  "Canada": {
    name: "Canada",
    numbers: ["988 (Suicide Crisis Helpline)", "1-833-456-4566"],
  },
  "Australia": {
    name: "Australia",
    numbers: ["13 11 14 (Lifeline)", "1300 659 467 (Suicide Call Back)"],
  },
  "India": {
    name: "India",
    numbers: ["91-9820466726 (AASRA)", "011-46116167 (Vandrevala)"],
  },
  "Singapore": {
    name: "Singapore",
    numbers: ["1767 (Samaritans of Singapore)", "6389-2222 (SOS 24hr)"],
  },
  "Malaysia": {
    name: "Malaysia",
    numbers: ["03-7956 8145 (Befrienders KL)"],
  },
  "Indonesia": {
    name: "Indonesia",
    numbers: ["021-500-454 (Krisis Center)", "119 (Emergency)"],
  },
  "Japan": {
    name: "Japan",
    numbers: ["0120-783-556 (Tokyo Mental Health)", "0570-064-556 (Tell)"],
  },
  "South Korea": {
    name: "South Korea",
    numbers: ["1393 (Suicide Prevention)", "1577-0199 (Mental Health)"],
  },
  "Brazil": {
    name: "Brazil",
    numbers: ["188 (CVV)", "112 (Emergency)"],
  },
  "Germany": {
    name: "Germany",
    numbers: ["0800 111 0 111 (Telefonseelsorge)", "0800 111 0 222"],
  },
  "France": {
    name: "France",
    numbers: ["3114 (Suicide Prevention)", "01 40 44 45 46 (SOS Amitié)"],
  },
  "Other": {
    name: "Other",
    numbers: ["112 (Emergency)", "Find local crisis support"],
  },
};

export function detectCrisisKeywords(text: string): boolean {
  const keywords = [
    "suicide", "kill myself", "end my life", "want to die", "better off dead",
    "suicidal", "self-harm", "self harm", "hurt myself", "no reason to live",
    "can't go on", "cant go on", "end it all", "not worth living",
    "take my own life", "end my suffering", "want to end", "end this",
    "not suffer", "suffer anymore", "my existence", "numb",
    "want this to end", "don't want to live", "dont want to live",
    "no way out", "can't take it anymore", "cant take it anymore",
    "over it all", "give up on life", "giving up on life", "die", "unalive",
    "tired of living", "tired of life", "not worth it", "want to disappear",
    "bullied", "bullying", "sexual abuse", "sexually abused", "raped", "rape",
    "molested", "molestation", "touched me", "abused me", "hit me",
    "domestic violence", "physical abuse", "emotional abuse", "trauma",
  ];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}
