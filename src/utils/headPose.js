export function estimateYaw(landmarks) {
  if (!landmarks?.length) {
    return 0;
  }

  const nose = landmarks[1];

  return nose.x - 0.5;
}