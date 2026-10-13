type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-4 md:mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-3xl">
        {title}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:mt-2">
        {description}
      </p>
    </header>
  );
}
