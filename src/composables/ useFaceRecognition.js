import { ref } from "vue";

export function useFaceRecognition() {
  const loading = ref(false);

  const countdown = ref(3);

  const faceDetected = ref(false);

  const capturedImage = ref(null);

  const currentStep = ref(0);

  const isCompleted = ref(false);

  const instructions = [
    "Hadapkan wajah ke kamera",
    "Putar kepala ke kiri",
    "Putar kepala ke kanan",
    "Hadapkan wajah ke kamera kembali",
  ];

  function nextStep() {
    if (currentStep.value < instructions.length - 1) {
      currentStep.value++;
      return;
    }

    isCompleted.value = true;
  }

  function resetLiveness() {
    currentStep.value = 0;
    isCompleted.value = false;
  }

  function setFaceDetected(status) {
    faceDetected.value = status;
  }

  function setCapturedImage(image) {
    capturedImage.value = image;
  }

  function clearCapturedImage() {
    capturedImage.value = null;
  }

  return {
    loading,

    faceDetected,

    capturedImage,

    currentStep,

    isCompleted,

    instructions,

    countdown,

    nextStep,

    resetLiveness,

    setFaceDetected,

    setCapturedImage,

    clearCapturedImage,
  };
}