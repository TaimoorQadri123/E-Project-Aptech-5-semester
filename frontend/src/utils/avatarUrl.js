const API_ORIGIN = "http://localhost:5000";

export function avatarUrl(profilePicturePath) {
  if (!profilePicturePath) return null;
  return `${API_ORIGIN}${profilePicturePath}`;
}
