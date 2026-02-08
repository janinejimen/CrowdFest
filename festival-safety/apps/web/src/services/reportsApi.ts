import { getApp } from "firebase/app";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

type CreateReportInput = any; // keep loose until backend shares exact type

export function reportsApi() {
  // ✅ getFunctions tied to your initialized Firebase app
  const functions = getFunctions(getApp());

  // ✅ only if you want emulator in dev
  // if (import.meta.env.DEV) connectFunctionsEmulator(functions, "localhost", 5001);

  const createReport = httpsCallable<{ eventId: string; input: CreateReportInput }, any>(
    functions,
    "createReportFn"
  );
  const claimReport = httpsCallable<{ eventId: string; reportId: string }, any>(
    functions,
    "claimReportFn"
  );
  const resolveReport = httpsCallable<
    { eventId: string; reportId: string; resolutionCode: string; resolutionSummary: string },
    any
  >(functions, "resolveReportFn");
  const postReportMessage = httpsCallable<{ eventId: string; reportId: string; text: string }, any>(
    functions,
    "postReportMessageFn"
  );

  return { createReport, claimReport, resolveReport, postReportMessage };
}
