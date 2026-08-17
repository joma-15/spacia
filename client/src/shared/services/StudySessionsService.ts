import { authenticatedFetch } from "@/shared/services/authenticatedFetch";

export interface StudySessionStartResponse {
  success: true;
  message: string;
  session_id: number;
  started_at: string;
  /** False when an already-active session was safely reused. */
  created: boolean;
}

export interface StudySessionEndResponse {
  success: true;
  message: string;
  session_id: number;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

export async function startStudySession(): Promise<StudySessionStartResponse> {
  console.log("📚 START STUDY SESSION");
  const response = await authenticatedFetch("/study-sessions/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startTime: new Date().toISOString() }),
  });
  const result = (await response.json()) as StudySessionStartResponse;
  console.log("📡 Start status:", response.status);
  console.log("📚 Session ID:", result.session_id);
  return result;
}

export async function endStudySession(sessionId: number): Promise<StudySessionEndResponse> {
  console.log("📚 END STUDY SESSION");
  const response = await authenticatedFetch("/study-sessions/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endTime: new Date().toISOString(), sessionId }),
  });
  const result = (await response.json()) as StudySessionEndResponse;
  console.log("📡 End status:", response.status);
  console.log("⏱ Duration seconds:", result.duration_seconds);
  return result;
}
