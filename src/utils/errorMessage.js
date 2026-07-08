const GENERIC_ERROR =
  "Terjadi kesalahan. Silakan coba lagi.";

const NETWORK_ERROR =
  "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";

const TIMEOUT_ERROR =
  "Permintaan terlalu lama diproses. Silakan coba lagi.";

const BLOCKED_PATTERNS = [
  /sql/i,
  /select .* from/i,
  /insert into/i,
  /update .* set/i,
  /delete from/i,
  /syntax error/i,
  /stack trace/i,
  /exception/i,
  /trace/i,
  /\/var\/|\/home\/|\/app\/|\\app\\/i,
  /node_modules/i,
];

function isSafeMessage(message) {
  if (!message || typeof message !== "string") return false;

  const trimmed = message.trim();

  if (!trimmed || trimmed.length > 180) return false;

  return !BLOCKED_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function getSafeErrorMessage(error, fallback = GENERIC_ERROR) {
  if (error?.code === "ECONNABORTED") {
    return TIMEOUT_ERROR;
  }

  if (error?.message === "Network Error" || !error?.response) {
    return NETWORK_ERROR;
  }

  const status = error.response?.status;

  if (status === 401) return "Sesi tidak valid. Silakan login kembali.";
  if (status === 403) return "Anda tidak memiliki akses ke fitur ini.";
  if (status === 404) return "Data tidak ditemukan.";
  if (status === 409) return "Data sudah digunakan atau terjadi konflik.";
  if (status === 422) return "Data yang dikirim belum valid.";
  if (status === 429) return "Terlalu banyak percobaan. Coba lagi nanti.";
  if (status >= 500) return "Server sedang bermasalah. Silakan coba lagi nanti.";

  const data = error.response?.data;
  const candidates = [
    data?.message,
    data?.error,
    error?.userMessage,
    fallback,
  ];

  const safeMessage = candidates.find(isSafeMessage);

  return safeMessage || fallback || GENERIC_ERROR;
}

export function getFieldError(error, fields = [], fallback = GENERIC_ERROR) {
  const errors = error?.response?.data?.errors;

  if (errors && typeof errors === "object") {
    for (const field of fields) {
      const message = Array.isArray(errors[field])
        ? errors[field][0]
        : errors[field];

      if (isSafeMessage(message)) {
        return message.trim();
      }
    }
  }

  return getSafeErrorMessage(error, fallback);
}
