const BRANCH_SHORT_FORMS: Array<[RegExp, string]> = [
  [/^COMPUTER SCIENCE AND ENGINEERING$/i, "CSE"],
  [/^COMPUTER SCIENCE AND ENGINEERING\s*\(ARTIFICIAL INTELLIGENCE\)$/i, "CSE(AI)"],
  [
    /^COMPUTER SCIENCE AND ENGINEERING\s*\(ARTIFICIAL INTELLIGENCE(?:\s*(?:AND|&)\s*MACHINE LEARNING)?\)$/i,
    "CSE(AI/ML)"
  ],
  [/^COMPUTER SCIENCE AND ENGINEERING\s*\(DATA SCIENCE\)$/i, "CSE(DS)"],
  [/^COMPUTER SCIENCE AND ENGINEERING\s*\(CYBER SECURITY\)$/i, "CSE(CY)"],
  [/^COMPUTER SCIENCE AND ENGINEERING\s*\(HINDI\)$/i, "CSE(H)"],
  [/^INFORMATION TECHNOLOGY$/i, "IT"],
  [/^ELECTRONICS AND COMMUNICATION ENGINEERING$/i, "ECE"],
  [/^ELECTRONICS AND INSTRUMENTATION ENGINEERING$/i, "EIE"],
  [/^ELECTRICAL AND ELECTRONICS ENGINEERING$/i, "EEE"],
  [/^ELECTRICAL ENGINEERING$/i, "EE"],
  [/^MECHANICAL ENGINEERING$/i, "ME"],
  [/^CIVIL ENGINEERING$/i, "CE"],
  [/^ARTIFICIAL INTELLIGENCE\s*\(AI\)\s*AND DATA SCIENCE$/i, "AI/DS"],
  [/^ARTIFICIAL INTELLIGENCE(?:\s*(?:AND|&)\s*MACHINE LEARNING)?$/i, "AI/ML"],
  [/^ARTIFICIAL INTELLIGENCE AND DATA SCIENCE$/i, "AI/DS"],
  [/^COMPUTER SCIENCE$/i, "CS"],
  [/^COMPUTER SCIENCE AND DESIGN$/i, "CSD"],
  [/^COMPUTER SCIENCE AND BUSINESS SYSTEMS?$/i, "CSBS"],
  [/^CHEMICAL ENGINEERING$/i, "ChE"],
  [/^AUTOMOBILE ENGINEERING$/i, "AutoE"],
  [/^AERONAUTICAL ENGINEERING$/i, "AerE"],
  [/^BIO(?:[-\s])?TECHNOLOGY$/i, "Biotech"]
];

export function formatBranchLabel(branchName: string | null | undefined) {
  const value = branchName?.trim();
  if (!value) return "--";

  for (const [pattern, shortForm] of BRANCH_SHORT_FORMS) {
    if (pattern.test(value)) {
      return shortForm;
    }
  }

  const generated = generateBranchAcronym(value);
  if (generated) {
    return generated;
  }

  return value;
}

function generateBranchAcronym(value: string) {
  if (value.length <= 14) {
    return null;
  }

  const normalized = value
    .replace(/\(.*?\)/g, " ")
    .replace(/[\/,&-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!normalized) {
    return null;
  }

  const multiWordReplacements: Array<[RegExp, string]> = [
    [/\bARTIFICIAL INTELLIGENCE\b/g, "AI"],
    [/\bMACHINE LEARNING\b/g, "ML"],
    [/\bDATA SCIENCE\b/g, "DS"],
    [/\bBUSINESS SYSTEMS?\b/g, "BS"],
    [/\bCYBER SECURITY\b/g, "CY"]
  ];

  const collapsed = multiWordReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    normalized
  );

  const stopWords = new Set(["AND", "OF", "THE", "IN"]);
  const parts = collapsed
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !stopWords.has(part));

  if (parts.length < 2) {
    return null;
  }

  const acronym = parts
    .map((part) => {
      if (part.length <= 3) {
        return part;
      }

      return part[0];
    })
    .join("");

  return acronym.length >= 2 && acronym.length <= 8 ? acronym : null;
}
