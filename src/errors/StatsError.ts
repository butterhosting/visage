import { Yexception } from "yexception";

export class StatsError {
  public static readonly NAME = "StatsError";

  public static readonly invalid_query = Yexception.field<{ errorQueryParams: string[] }>();

  static {
    Yexception.initialize(this);
  }
}
