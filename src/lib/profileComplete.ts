export function isProfileComplete(
  user: { profileComplete?: boolean; username?: string } | null | undefined,
) {
  if (!user) return false;
  if (user.profileComplete) return true;
  const username = user.username?.trim() ?? "";
  return username.length >= 3 && !/^anon_/i.test(username);
}
