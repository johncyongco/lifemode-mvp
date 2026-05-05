import { supabase } from "./supabaseClient";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveSession(session: {
  id: string;
  user_id: string;
  intent: string;
  mode: string;
  thought: string;
  messages: { role: string; text: string }[];
  exchange_count: number;
  status: string;
  clarity_data: { micro: string; macro: string; perspective: string } | null;
}) {
  if (!UUID_RE.test(session.id)) return { error: null };
  const { error } = await supabase.from("sessions").upsert(
    {
      id: session.id,
      user_id: session.user_id,
      intent: session.intent,
      mode: session.mode,
      thought: session.thought,
      messages: session.messages,
      exchange_count: session.exchange_count,
      status: session.status,
      clarity_data: session.clarity_data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) console.error("saveSession error:", error);
  return { error };
}

export async function loadSessions(userId: string) {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) {
      if (error.code === "PGRST116") return { data: [], error: null };
      console.error("loadSessions error:", error);
    }
    return { data: (data || []) as any[], error };
  } catch {
    return { data: [], error: null };
  }
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);
  if (error) console.error("deleteSession error:", error);
  return { error };
}
