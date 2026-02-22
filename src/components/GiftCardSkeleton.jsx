export default function GiftCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-dark/5" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 bg-dark/5 rounded-full" />
          <div className="h-5 w-16 bg-dark/5 rounded" />
        </div>
        <div className="h-5 w-3/4 bg-dark/5 rounded" />
        <div className="h-11 w-full bg-dark/5 rounded-lg" />
        <div className="h-4 w-24 bg-dark/5 rounded mx-auto" />
      </div>
    </div>
  );
}
