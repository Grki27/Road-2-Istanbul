export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Učitavanje admin stranice">
      <div className="h-5 w-32 rounded-full bg-coffee/10" />
      <div className="h-12 max-w-xl rounded-2xl bg-coffee/10" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 rounded-2xl bg-coffee/10" />
        <div className="h-36 rounded-2xl bg-coffee/10" />
      </div>
    </div>
  );
}
