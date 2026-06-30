import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker = null;

export async function initFaceLandmarker() {
  if (faceLandmarker) {
    return faceLandmarker;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
    },

    runningMode: "VIDEO",

    numFaces: 2,

    outputFaceBlendshapes: true,

    outputFacialTransformationMatrixes: true,
  });

  return faceLandmarker;
}

export function detectFace(videoElement) {
  if (!faceLandmarker || !videoElement) {
    return null;
  }

  return faceLandmarker.detectForVideo(
    videoElement,
    performance.now()
  );
}

export function destroyFaceLandmarker() {
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
}
