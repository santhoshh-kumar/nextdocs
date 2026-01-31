import RoomPageClient from '@/components/RoomPageClient';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return <RoomPageClient roomId={roomId} />;
}
