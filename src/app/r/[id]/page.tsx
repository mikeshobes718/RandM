import LandingClient from './LandingClient';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LandingClient id={id} />;
}

