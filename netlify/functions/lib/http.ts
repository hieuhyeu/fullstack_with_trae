export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  meta?: Record<string, JsonValue>;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
  status_code: number;
};

export function json(
  statusCode: number,
  body: ApiSuccessResponse<JsonValue> | ApiErrorResponse,
  headers: Record<string, string> = {}
) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    },
    body: JSON.stringify(body)
  };
}

