interface Props {
  title: string;
  message: string;
  // Captured error stack. Only ever passed (and rendered) in dev — the root
  // ErrorBoundary gates it on `import.meta.env.DEV`, so production bundles
  // never ship the trace. Rendered in a scrollable monospace block below the
  // message.
  stack?: string;
}

export function FallbackPage({title, message, stack}: Props) {
  return (
    <main className="flex-1 p-8 text-center">
      <h1 className="m-0 mb-2 font-serif text-display font-medium text-foreground">{title}</h1>
      <p className="m-0 text-muted-foreground">{message}</p>
      {stack !== undefined && (
        <pre className="mx-auto mt-6 max-w-prose-narrow overflow-x-auto rounded-md bg-muted p-4 text-left text-sm text-muted-foreground">
          <code className="font-mono">{stack}</code>
        </pre>
      )}
    </main>
  );
}
