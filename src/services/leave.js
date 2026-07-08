import API from "./api";

export const getLeaveTypesAPI =
  async () => {
    try {
      const response =
        await API.get(
          "/employee/leave/types",
        );

      return response;
    } catch (error) {
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
      const response =
        await API.get(
          "/employee/leave/quota",
        );

      return response;
    } catch (error) {
      throw error;
    }
  };

export const submitLeaveAPI =
  async (formData) => {
    try {
      const response =
        await API.post(
          "/employee/leave/request",
          formData,
        );

      return response;
    } catch (error) {
      throw error;
    }
  };

export const getLeaveHistoryAPI =
  async (
    page = 1,
    limit = 10,
  ) => {
    try {
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

      return response;
    } catch (error) {
      throw error;
    }
  };

export const cancelLeaveAPI =
  async (id) => {
    try {
      const response =
        await API.patch(
          `/employee/leave/${id}/cancel`,
        );

      return response;
    } catch (error) {
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
      const response =
        await API.patch(
          `/employee/leave/notifications/${id}/read`,
        );

      return response;
    } catch (error) {
      if (
        error?.response?.data
          ?.code ===
        "INVALID_ID"
      ) {
      }

      throw error;
    }
  };

  export const markAllLeaveNotificationsReadAPI =
  async () => {
    try {
      const response =
        await API.patch(
          "/employee/leave/notifications/read-all",
        );

      return response;
    } catch (error) {
      throw error;
    }
  };
