export type SkinConditionResponse = {
  success: boolean;
  task: string;
  filename?: string;
  result?: {
    condition?: "acne" | "spots" | "wrinkles";
    confidence?: number;
    all_probs?: {
      acne: number;
      spots: number;
      wrinkles: number;
    };
  };
};

export type SkinTypeResponse = {
  success: boolean;
  task: string;
  result?: {
    skin_type?: "combination" | "dry" | "normal" | "oily";
    confidence?: number;
    all_probs?: {
      combination: number;
      dry: number;
      normal: number;
      oily: number;
    };
  };
};

export type AcneSeverityResponse = {
  success: boolean;
  condition: "Acne";
  severity: "Mild" | "Moderate" | "Severe" | "VerySevere";
  confidence?: number;
  mode?: string;
  recommendation_policy?: "general_skincare" | "doctor_consultation_suggested";
  cnn?: {
    prediction: "Mild" | "Moderate" | "Severe" | "VerySevere";
    confidence: number;
    probs: {
      Mild: number;
      Moderate: number;
      Severe: number;
      VerySevere: number;
    };
  };
  yolo?: {
    yolo_available: boolean;
    yolo_count: number;
    mean_conf: number;
    sum_conf: number;
    sum_area: number;
  };
  ensemble_probs: {
    Mild: number;
    Moderate: number;
    Severe: number;
    VerySevere: number;
  };
};

/**
 * Privacy-friendly, normalized payload used by our platform.
 * We do NOT store images; we store this JSON only.
 */
export type StoredSkinAnalysis = {
  type?: "combination" | "dry" | "normal" | "oily";
  // Note: we do not store "spots"; it's normalized into "acne".
  condition?: "acne" | "wrinkles";
  severity?: "Mild" | "Moderate" | "Severe" | "VerySevere";
  recommendation_policy?: "general_skincare" | "doctor_consultation_suggested";
  yolo_count?: number;
  confidence?: {
    type?: number;
    condition?: number;
    severity?: number;
  };
  probs?: {
    type?: NonNullable<NonNullable<SkinTypeResponse["result"]>["all_probs"]>;
    // Note: "spots" is folded into "acne" during normalization.
    condition?: { acne: number; wrinkles: number };
    severity?: AcneSeverityResponse["ensemble_probs"];
  };
};

const DEFAULTS = {
  conditionUrl:
    "https://buddhism-unburned-chute.ngrok-free.dev/predict/condition",
  skinTypeUrl: "https://suds-isolated-repave.ngrok-free.dev/predict/skin-type",
  acneSeverityUrl:
    "https://scoured-negotiate-pessimism.ngrok-free.dev/predict/acne-severity",
};

export async function analyzeSkinFromImage(input: {
  filename: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<StoredSkinAnalysis> {
  const conditionUrl = (
    process.env.SKIN_API_CONDITION_URL || DEFAULTS.conditionUrl
  ).trim();
  const skinTypeUrl = (
    process.env.SKIN_API_SKIN_TYPE_URL || DEFAULTS.skinTypeUrl
  ).trim();
  const acneSeverityUrl = (
    process.env.SKIN_API_ACNE_SEVERITY_URL || DEFAULTS.acneSeverityUrl
  ).trim();

  // Create a copy backed by a standard ArrayBuffer (avoids SharedArrayBuffer typing issues).
  const bytesCopy = Uint8Array.from(input.bytes);
  const blob = new Blob([bytesCopy], { type: input.contentType });

  const conditionForm = new FormData();
  conditionForm.append("file", blob, input.filename);

  const skinTypeForm = new FormData();
  skinTypeForm.append("file", blob, input.filename);

  const severityForm = new FormData();
  // This API uses `image` instead of `file`
  severityForm.append("image", blob, input.filename);

  const [conditionRes, skinTypeRes] = await Promise.all([
    fetchJson<SkinConditionResponse>(conditionUrl, conditionForm),
    fetchJson<SkinTypeResponse>(skinTypeUrl, skinTypeForm),
  ]);

  let acneSeverityRes: AcneSeverityResponse | undefined;

  if (conditionRes.result?.condition !== "wrinkles") {
    acneSeverityRes = await fetchJson<AcneSeverityResponse>(
      acneSeverityUrl,
      severityForm,
    );
  }

  return normalize(conditionRes, skinTypeRes, acneSeverityRes);
}

function normalize(
  conditionRes: SkinConditionResponse,
  skinTypeRes: SkinTypeResponse,
  acneSeverityRes?: AcneSeverityResponse,
): StoredSkinAnalysis {
  const rawCondition = conditionRes.result?.condition;
  const yoloCount = acneSeverityRes?.yolo?.yolo_count;

  // Primary normalization:
  // - wrinkles stays wrinkles
  // - acne/spots are treated as acne *only if* yolo_count indicates acne instances.
  //   If yolo_count === 0, treat as "no acne detected" (condition omitted).
  const normalizedCondition: StoredSkinAnalysis["condition"] | undefined =
    rawCondition === "wrinkles" ? "wrinkles" : yoloCount === 0 ? undefined : "acne";

  const rawProbs = conditionRes.result?.all_probs;
  const conditionProbs = rawProbs
    ? {
        acne: clamp01((rawProbs.acne ?? 0) + (rawProbs.spots ?? 0)),
        wrinkles: clamp01(rawProbs.wrinkles ?? 0),
      }
    : undefined;

  return {
    type: skinTypeRes.result?.skin_type,
    condition: normalizedCondition,
    severity: normalizedCondition === "acne" ? acneSeverityRes?.severity : undefined,
    recommendation_policy:
      normalizedCondition === "acne" ? acneSeverityRes?.recommendation_policy : undefined,
    yolo_count: yoloCount,
    confidence: {
      type: skinTypeRes.result?.confidence,
      condition: conditionRes.result?.confidence,
      severity: normalizedCondition === "acne" ? acneSeverityRes?.confidence : undefined,
    },
    probs: {
      type: skinTypeRes.result?.all_probs,
      condition: conditionProbs,
      severity: normalizedCondition === "acne" ? acneSeverityRes?.ensemble_probs : undefined,
    },
  };
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

async function fetchJson<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { accept: "application/json" },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `skin_api_error ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`,
    );
  }
  return (await res.json()) as T;
}
