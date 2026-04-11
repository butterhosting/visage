import { Exception } from "./exception/Exception";

export class TokenError {
  public static readonly _NAME_ = "TokenError";
  public static readonly not_found: Exception.Fn<{ id?: string }>;

  static {
    Exception.initializeFields(this);
  }
}
