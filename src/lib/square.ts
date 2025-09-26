import { Client, Environment } from 'square';
import { getSupabaseAdmin } from './supabaseAdmin';

export type SquareConnectionRow = {
  uid: string;
  business_id: string | null;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  merchant_id: string | null;
  default_location_id: string | null;
  sandbox: boolean;
  created_at: string;
  updated_at: string;
  last_backfill_at: string | null;
};

export type SquareBackfillJobRow = {
  id: string;
  uid: string;
  business_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  requested_range_start: string | null;
  requested_range_end: string | null;
  filters: Record<string, unknown> | null;
  total_customers: number | null;
  sent_count: number | null;
  skipped_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export function getSquareClient(connection: SquareConnectionRow): Client {
  return new Client({
    accessToken: connection.access_token,
    environment: connection.sandbox ? Environment.Sandbox : Environment.Production,
  });
}

export async function getSquareConnectionForUser(uid: string): Promise<SquareConnectionRow | null> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from('square_connections')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();
  if (error) throw error;
  return (data as SquareConnectionRow | null) || null;
}

export async function createBackfillJob(params: {
  uid: string;
  businessId: string;
  status?: SquareBackfillJobRow['status'];
  requestedStart?: string | null;
  requestedEnd?: string | null;
  filters?: Record<string, unknown> | null;
}): Promise<SquareBackfillJobRow> {
  const supa = getSupabaseAdmin();
  const { data, error } = await supa
    .from('square_backfill_jobs')
    .insert({
      uid: params.uid,
      business_id: params.businessId,
      status: params.status ?? 'pending',
      requested_range_start: params.requestedStart ?? null,
      requested_range_end: params.requestedEnd ?? null,
      filters: params.filters ?? null,
    })
    .select('*')
    .maybeSingle();
  if (error || !data) throw error ?? new Error('Unable to create backfill job');
  return data as SquareBackfillJobRow;
}

export async function updateBackfillJob(jobId: string, patch: Partial<SquareBackfillJobRow>) {
  const supa = getSupabaseAdmin();
  const { error } = await supa
    .from('square_backfill_jobs')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
  if (error) throw error;
}

export async function markBackfillCompleted(jobId: string, patch: {
  total: number;
  sent: number;
  skipped: number;
}) {
  const supa = getSupabaseAdmin();
  const { error } = await supa
    .from('square_backfill_jobs')
    .update({
      status: 'completed',
      total_customers: patch.total,
      sent_count: patch.sent,
      skipped_count: patch.skipped,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
  if (error) throw error;
}

export async function markBackfillFailed(jobId: string, message: string) {
  const supa = getSupabaseAdmin();
  const { error } = await supa
    .from('square_backfill_jobs')
    .update({
      status: 'failed',
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
  if (error) throw error;
}

export async function touchSquareLastBackfill(uid: string) {
  const supa = getSupabaseAdmin();
  const { error } = await supa
    .from('square_connections')
    .update({
      last_backfill_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('uid', uid);
  if (error) throw error;
}
