import LandingClient from './LandingClient';
import { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supa = getSupabaseAdmin();
  
  const { data: biz } = await supa
    .from('businesses')
    .select('name, landing_headline, landing_subheading')
    .eq('id', id)
    .maybeSingle();

  if (!biz) {
    return {
      title: 'Reviews & Marketing',
      description: 'Share your feedback and help us improve.',
    };
  }

  const title = `${biz.name} — Review & Feedback`;
  const description = biz.landing_headline || `Share your experience with ${biz.name}. Your feedback helps us grow!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <LandingClient id={id} />;
}
