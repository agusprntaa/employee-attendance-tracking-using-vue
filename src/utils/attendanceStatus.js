export function getStatusLabel(status) {
  if (status === "ON_TIME") return "HADIR";

  // support data lama
  if (status === "PRESENT") return "HADIR";

  if (status === "LATE") return "TERLAMBAT";

  if (status === "WFA") return "WFA";

  // pulang cepat tetap hadir
  if (status === "EARLY_LEAVE") return "HADIR";

  if (status === "ABSENT") return "ABSEN";

  if (status === "BELUM_ABSEN") return "BELUM ABSEN";

  return status;
}

export function getStatusClass(status) {
  if (status === "ON_TIME") return "hadir";

  // support data lama
  if (status === "PRESENT") return "hadir";

  if (status === "LATE") return "late";

  if (status === "WFA") return "wfa";

  // pulang cepat tetap hijau hadir
  if (status === "EARLY_LEAVE") return "hadir";

  if (status === "ABSENT") return "absent";

  if (status === "BELUM_ABSEN") return "belum_absen";

  return "";
}