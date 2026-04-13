import { Exception } from "./exception/Exception";

export class WebsiteError {
  public static readonly _NAME_ = "WebsiteError";
  public static readonly not_found: Exception.Fn<{ ref: string }>;
  public static readonly already_exists: Exception.Fn<{ hostname: string }>;

  static {
    Exception.initializeFields(this);
  }
}
