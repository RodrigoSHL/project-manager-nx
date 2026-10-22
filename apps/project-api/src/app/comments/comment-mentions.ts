const TOKEN =
  /@\{member:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([^}]+)\}/gi;

export function parseCommentMentions(body: string) {
  const memberIds = new Set<string>();
  const text = body.replace(TOKEN, (token, id: string, label: string) => {
    try {
      const name = decodeURIComponent(label);
      memberIds.add(id.toLowerCase());
      return `@${name}`;
    } catch {
      return token;
    }
  });
  return { text, memberIds };
}
