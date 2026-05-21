import { logoutAPI } from "@/services/auth";

export async function logout() {
  try {
    const refresh =
      localStorage.getItem(
        "refresh_token"
      );

    if (refresh) {
      await logoutAPI(refresh);
    }
  } catch (err) {
    console.error(
      "LOGOUT ERROR:",
      err
    );
  } finally {
    localStorage.removeItem("token");

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem("user");

    localStorage.removeItem(
      "must_change_password"
    );

    window.location.href = "/";
  }
}