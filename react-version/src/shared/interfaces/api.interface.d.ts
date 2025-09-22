interface IApiResponse<T> {
  statusCode: number;
  message: IApiMessage;
  data: T;
}

type IApiMessage = string;

interface IApiError {
  message: IApiMessage;
  status: number;
}
