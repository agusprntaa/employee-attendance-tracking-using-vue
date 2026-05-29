import API from "./api";

export const getLeaveTypesAPI =
  async () => {
    try {
      console.log(
        "[FE] FETCH LEAVE TYPES",
      );

      const response =
        await API.get(
          "/employee/leave/types",
        );

      console.log(
        "[BE SUCCESS] LEAVE TYPES:",
        response.data,
      );

      return response;
    } catch (error) {
      console.error(
        "[BE ERROR] GET LEAVE TYPES FAILED",
      );

      console.error(
        "STATUS:",
        error?.response?.status,
      );

      console.error(
        "RESPONSE:",
        error?.response?.data,
      );

      throw error;
    }
  };

export const getLeaveHolidaysAPI =
  (year) => {
    return API.get(
      "/employee/leave/holidays",
      {
        params: {
          tahun: year,
        },
      },
    );
  };

export const getLeaveQuotaAPI =
  async () => {
    try {
      console.log(
        "[FE] FETCH LEAVE QUOTA",
      );

      const response =
        await API.get(
          "/employee/leave/quota",
        );

      console.log(
        "[BE SUCCESS] LEAVE QUOTA:",
        response.data,
      );

      return response;
    } catch (error) {
      console.error(
        "[BE ERROR] GET LEAVE QUOTA FAILED",
      );

      console.error(
        "STATUS:",
        error?.response?.status,
      );

      console.error(
        "RESPONSE:",
        error?.response?.data,
      );

      throw error;
    }
  };

export const submitLeaveAPI =
  async (formData) => {
    try {
      console.log(
        "[FE] SUBMIT LEAVE REQUEST",
      );

      for (const pair of formData.entries()) {
        console.log(
          pair[0],
          pair[1],
        );
      }

      const response =
        await API.post(
          "/employee/leave/request",
          formData,
        );

      console.log(
        "[BE SUCCESS] SUBMIT LEAVE:",
        response.data,
      );

      return response;
    } catch (error) {
      console.error(
        "[BE ERROR] SUBMIT LEAVE FAILED",
      );

      console.error(
        "STATUS:",
        error?.response?.status,
      );

      console.error(
        "RESPONSE:",
        error?.response?.data,
      );

      console.error(
        "CHECK:",
      );

      console.error(
        "- multipart/form-data",
      );

      console.error(
        "- attachment field name",
      );

      console.error(
        "- validation backend",
      );

      console.error(
        "- auth token",
      );

      throw error;
    }
  };

export const getLeaveHistoryAPI =
  async (
    page = 1,
    limit = 10,
  ) => {
    try {
      console.log(
        "[FE] FETCH LEAVE HISTORY",
      );

      console.log("PAGE:", page);

      console.log(
        "LIMIT:",
        limit,
      );

      const response =
        await API.get(
          "/employee/leave/history",
          {
            params: {
              page,
              limit,
            },
          },
        );

      console.log(
        "[BE SUCCESS] LEAVE HISTORY:",
        response.data,
      );

      return response;
    } catch (error) {
      console.error(
        "[BE ERROR] GET LEAVE HISTORY FAILED",
      );

      console.error(
        "STATUS:",
        error?.response?.status,
      );

      console.error(
        "RESPONSE:",
        error?.response?.data,
      );

      console.error(
        "CHECK BACKEND:",
      );

      console.error(
        "- controller leave history",
      );

      console.error(
        "- auth middleware",
      );

      console.error(
        "- database relation",
      );

      console.error(
        "- pagination query",
      );

      throw error;
    }
  };

export const cancelLeaveAPI =
  async (id) => {
    try {
      console.log(
        "[FE] CANCEL LEAVE:",
        id,
      );

      const response =
        await API.patch(
          `/employee/leave/${id}/cancel`,
        );

      console.log(
        "[BE SUCCESS] CANCEL LEAVE:",
        response.data,
      );

      return response;
    } catch (error) {
      console.error(
        "[BE ERROR] CANCEL LEAVE FAILED",
      );

      console.error(
        "STATUS:",
        error?.response?.status,
      );

      console.error(
        "RESPONSE:",
        error?.response?.data,
      );

      throw error;
    }
  };

  export const getLeaveNotificationsAPI =
  (
    page = 1,
    limit = 5,
    status = "all",
  ) => {
    return API.get(
      "/employee/leave/notifications",
      {
        params: {
          page,
          limit,
          status,
        },
      },
    );
  };

  export const markLeaveNotificationReadAPI =
  async (id) => {
    try {
      console.log(
        "[FE] MARK NOTIFICATION READ:",
        id,
      );

      const response =
        await API.patch(
          `/employee/leave/notifications/${id}/read`,
        );

      console.log(
        "[BE SUCCESS] NOTIFICATION READ:",
        response.data,
      );

      return response;
    } catch (error) {
      console.error(
        "[BE ERROR] MARK NOTIFICATION READ FAILED",
      );

      console.error(
        "STATUS:",
        error?.response?.status,
      );

      console.error(
        "RESPONSE:",
        error?.response?.data,
      );

      if (
        error?.response?.data
          ?.code ===
        "INVALID_ID"
      ) {
        console.error(
          "[BE ERROR] INVALID NOTIFICATION ID",
        );
      }

      throw error;
    }
  };

  export const markAllLeaveNotificationsReadAPI =
  async () => {
    try {
      console.log(
        "[FE] MARK ALL NOTIFICATIONS READ",
      );

      const response =
        await API.patch(
          "/employee/leave/notifications/read-all",
        );

      console.log(
        "[BE SUCCESS] ALL NOTIFICATIONS READ:",
        response.data,
      );

      return response;
    } catch (error) {
      console.error(
        "[BE ERROR] MARK ALL NOTIFICATIONS READ FAILED",
      );

      console.error(
        "STATUS:",
        error?.response?.status,
      );

      console.error(
        "RESPONSE:",
        error?.response?.data,
      );

      throw error;
    }
  };