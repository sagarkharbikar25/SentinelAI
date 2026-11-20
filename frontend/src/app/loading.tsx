import LoadingScreen from '@/components/ui/LoadingScreen';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <LoadingScreen message="Loading security telemetry & policy models..." />
    </div>
  );
}
