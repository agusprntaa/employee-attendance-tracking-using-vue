const SAMPLE_WIDTH = 160;

function getFaceBounds(landmarks) {
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function getLightAndSharpness(video) {
  const canvas = document.createElement("canvas");
  const ratio = video.videoHeight / video.videoWidth || 0.75;
  canvas.width = SAMPLE_WIDTH;
  canvas.height = Math.max(90, Math.round(SAMPLE_WIDTH * ratio));

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const luminance = new Float32Array(canvas.width * canvas.height);
  let total = 0;
  let darkPixels = 0;
  let brightPixels = 0;

  for (let pixel = 0, index = 0; pixel < data.length; pixel += 4, index += 1) {
    const value =
      0.2126 * data[pixel] +
      0.7152 * data[pixel + 1] +
      0.0722 * data[pixel + 2];

    luminance[index] = value;
    total += value;
    if (value < 40) darkPixels += 1;
    if (value > 245) brightPixels += 1;
  }

  let edgeTotal = 0;
  let edgeCount = 0;
  for (let y = 1; y < canvas.height; y += 1) {
    for (let x = 1; x < canvas.width; x += 1) {
      const index = y * canvas.width + x;
      edgeTotal += Math.abs(luminance[index] - luminance[index - 1]);
      edgeTotal += Math.abs(luminance[index] - luminance[index - canvas.width]);
      edgeCount += 2;
    }
  }

  return {
    brightness: total / luminance.length,
    darkRatio: darkPixels / luminance.length,
    brightRatio: brightPixels / luminance.length,
    sharpness: edgeCount ? edgeTotal / edgeCount : 0,
  };
}

export function estimateHeadPose(landmarks) {
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const nose = landmarks[1];

  if (!leftCheek || !rightCheek || !forehead || !chin || !nose) {
    return { yaw: 0, pitch: 0 };
  }

  const faceWidth = Math.max(Math.abs(rightCheek.x - leftCheek.x), 0.001);
  const faceHeight = Math.max(Math.abs(chin.y - forehead.y), 0.001);
  const horizontalCenter = (leftCheek.x + rightCheek.x) / 2;
  const noseVerticalPosition = (nose.y - forehead.y) / faceHeight;

  return {
    yaw: (nose.x - horizontalCenter) / faceWidth,
    pitch: noseVerticalPosition - 0.45,
  };
}

function matchesPose(pose, headPose) {
  const { yaw, pitch } = headPose;

  if (pose === "left") return yaw < -0.08;
  if (pose === "right") return yaw > 0.08;
  if (pose === "up") return pitch < -0.055;
  if (pose === "down") return pitch > 0.075;

  return Math.abs(yaw) < 0.08 && Math.abs(pitch) < 0.09;
}

export function evaluateFaceFrame(video, detection, requiredPose = "front") {
  const faces = detection?.faceLandmarks || [];

  if (faces.length === 0) {
    return { ready: false, code: "NO_FACE", message: "Posisikan wajah di dalam bingkai" };
  }

  if (faces.length > 1) {
    return { ready: false, code: "MULTIPLE_FACES", message: "Pastikan hanya satu orang di kamera" };
  }

  const landmarks = faces[0];
  const bounds = getFaceBounds(landmarks);
  const headPose = estimateHeadPose(landmarks);

  if (bounds.width < 0.22 || bounds.height < 0.3) {
    return { ready: false, code: "TOO_FAR", message: "Dekatkan wajah ke kamera" };
  }

  if (bounds.width > 0.72 || bounds.height > 0.86) {
    return { ready: false, code: "TOO_CLOSE", message: "Jauhkan wajah sedikit" };
  }

  if (Math.abs(bounds.centerX - 0.5) > 0.13 || Math.abs(bounds.centerY - 0.5) > 0.16) {
    return { ready: false, code: "NOT_CENTERED", message: "Posisikan wajah di tengah bingkai" };
  }

  if (!matchesPose(requiredPose, headPose)) {
    return { ready: false, code: "WRONG_POSE", message: "Sesuaikan arah wajah dengan petunjuk" };
  }

  const imageQuality = getLightAndSharpness(video);

  if (imageQuality.brightness < 60 || imageQuality.darkRatio > 0.55) {
    return { ready: false, code: "TOO_DARK", message: "Wajah terlalu gelap, cari tempat lebih terang" };
  }

  if (imageQuality.brightness > 220 || imageQuality.brightRatio > 0.4) {
    return { ready: false, code: "TOO_BRIGHT", message: "Cahaya terlalu terang, hindari lampu dari belakang" };
  }

  if (imageQuality.sharpness < 6) {
    return { ready: false, code: "BLURRY", message: "Kamera belum fokus, tahan posisi sebentar" };
  }

  return {
    ready: true,
    code: "READY",
    message: "Foto siap diambil",
    metrics: { ...imageQuality, ...bounds, ...headPose },
  };
}

export function captureVideoFrame(video, filename = "face.jpg") {
  return new Promise((resolve, reject) => {
    if (!video?.videoWidth || !video?.videoHeight) {
      reject(new Error("Kamera belum siap"));
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengambil foto"));
          return;
        }

        resolve(new File([blob], filename, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  });
}
