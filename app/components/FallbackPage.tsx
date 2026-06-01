interface Props {
  title: string;
  message: string;
}

export function FallbackPage({title, message}: Props) {
  return (
    <main className="flex-1 p-8 text-center">
      <h1 className="m-0 mb-2 font-serif text-display font-medium text-foreground">{title}</h1>
      <p className="m-0 text-muted-foreground">{message}</p>
    </main>
  );
}
