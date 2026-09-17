export default function Loading() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          جارٍ التحميل...
        </p>
      </div>
    </div>
  );
}