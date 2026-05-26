interface Props {
  title: string;
  message: string;
}

export function FallbackPage({title, message}: Props) {
  return (
    <main className="flex-1 p-8 text-center">
      <h1 className="font-serif font-medium text-display m-0 mb-2 text-ink">{title}</h1>
      <p className="m-0 text-ink-soft">{message}</p>
    </main>
  );
}
