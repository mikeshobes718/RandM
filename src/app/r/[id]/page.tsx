import LandingClient from './LandingClient';
import { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

function buildMeta(name: string, headline?: string | null) {
  const title = `${name} — Share Your Feedback`;
  const description = headline || `Share your experience with ${name}. Your feedback helps us grow!`;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, siteName: 'Reviews & Marketing', type: 'website' as const },
    twitter: { card: 'summary_large_image' as const, title, description },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supa = getSupabaseAdmin();
  const columns = 'name, landing_headline, landing_subheading';

  const { data: biz } = await supa.from('businesses').select(columns).eq('id', id).maybeSingle();
  if (biz) return buildMeta(biz.name, biz.landing_headline);

  const { data: slugBiz } = await supa.from('businesses').select(columns).eq('slug', id).maybeSingle();
  if (slugBiz) return buildMeta(slugBiz.name, slugBiz.landing_headline);

  return { title: 'Review & Feedback', description: 'Share your feedback and help us improve.' };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <LandingClient id={id} />;
}
