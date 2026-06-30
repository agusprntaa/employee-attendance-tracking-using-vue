import API from "./api";

export function getOnboardingStatusAPI() {
  return API.get("/employee/onboarding-status");
}

export function getFaceStatusAPI() {
  return API.get("/employee/face/status");
}

export function registerFaceAPI(formData) {
  return API.post("/employee/face/register", formData);
}
