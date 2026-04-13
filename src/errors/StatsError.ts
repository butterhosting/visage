import { Exception } from "./exception/Exception";

export class StatsError {
  public static readonly _NAME_ = "StatsError";

  public static readonly invalid_query: Exception.Fn<{ errorQueryParams: string[] }>;

  static {
    Exception.initializeFields(this);
  }
}
