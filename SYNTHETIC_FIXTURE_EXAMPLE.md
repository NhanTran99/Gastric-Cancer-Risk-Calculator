# Synthetic local-mode fixture — FOR LOCAL TESTING ONLY

This file is documentation, not application code. It contains a
**synthetic, invented** patient record — no real cohort data — for you
to hand-copy locally to test `loadExistingPatientLocal()`. Nothing in
this change set creates these files automatically, and both target
paths are covered by the `.gitignore` additions in this package.

## 1. Create the index

`public/local-data/cohort/index.json`
```json
["EXAMPLE"]
```

## 2. Create the synthetic record

`public/local-data/cohort/EXAMPLE.json`
```json
{
  "identity": { "patientId": "EXAMPLE", "initialDate": "2024-01-15", "provenance": "cohort-local" },
  "demographics": { "age": 63, "sex": "Male", "bmi": 21.4 },
  "laboratory": {
    "rbc": "unknown", "hgb": "unknown", "hct": "unknown",
    "plt": 310, "wbc": "unknown",
    "neutrophils": "unknown", "lymphocytes": "unknown",
    "nlr": 3.2, "plr": 195,
    "nlrSource": "direct", "plrSource": "direct"
  },
  "tumorPathology": {
    "location": "Antrum", "locationDescription": "unknown", "multisite": "Single site",
    "curvature": "unknown", "tumorDiameter": "4 x 3", "sizeClass": "unknown",
    "morphology": "unknown", "morphologyClass": "unknown",
    "grade": 3, "tumorGrade": "Poor differentiation", "gradeClass": "High risk",
    "tnmT": "unknown", "nodeNumber": "unknown", "nodeTnm": "unknown",
    "stage": "unknown", "stageTnm": "unknown"
  },
  "treatment": { "surgery": 1, "chemotherapy": 1, "chemoType": "Adjuvant", "regimen": "FOLFOX" },
  "observedOutcomes": {
    "recurrence": 0, "recurrenceDate": "unknown",
    "vitalStatus": 1, "deathDate": "unknown",
    "metastasisDescription": "unknown", "metastasisNumber": "unknown",
    "metastasisTNM": 0
  },
  "predictedFutureState": {
    "metastasisPrediction": { "status": "not-run" },
    "survivalPrediction": { "status": "not-run" }
  }
}
```

Notes:
- `grade`, `tumorGrade`, `gradeClass` above satisfy
  `validatePathologyConsistency()` — Grade 3 → Poor differentiation →
  High risk, matching the locked ID-07 table exactly. If you edit this
  fixture, keep those three fields consistent or the record will be
  rejected by validation, by design.
- `observedOutcomes.metastasisTNM = 0` lets `LoadExistingPatient.tsx`
  compare this observed value against the survival model's prediction
  once you run Predictions — that comparison view is the whole point
  of the "predicted vs observed" feature in Local mode.
- Run `npm run dev`, choose "Load Existing Patient" in the VPG tab,
  and load `EXAMPLE`.
