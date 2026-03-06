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
    // Try slug lookup if UUID lookup fails
    const { data: slugBiz } = await supa
      .from('businesses')
      .select('name, landing_headline, landing_subheading')
      .eq('slug', id)
      .maybeSingle();
      
    if (slugBiz) {
      const title = `${slugBiz.name} — Share Your Feedback`;
      const description = slugBiz.landing_headline || `Share your experience with ${slugBiz.name}. Your feedback helps us grow!`;

      return {
        title: {
          absolute: title,
        },
        description,
        openGraph: {
          title,
          description,
          siteName: 'Reviews & Marketing',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
        },
      };
    }

    return {
      title: 'Review & Feedback',
      description: 'Share your feedback and help us improve.',
    };
  }

  const title = `${biz.name} — Share Your Feedback`;
  const description = biz.landing_headline || `Share your experience with ${biz.name}. Your feedback helps us grow!`;

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      siteName: 'Reviews & Marketing',
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
