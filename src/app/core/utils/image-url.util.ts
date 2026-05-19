export function displayImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const driveFileId = googleDriveFileId(trimmed);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
  }

  return trimmed;
}

function googleDriveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/,
    /drive\.google\.com\/uc\?(?:.*&)?id=([^&#]+)/,
    /drive\.google\.com\/thumbnail\?(?:.*&)?id=([^&#]+)/,
    /drive\.google\.com\/open\?(?:.*&)?id=([^&#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}
