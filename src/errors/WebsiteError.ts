import { Yexception } from "yexception";

export class WebsiteError {
  public static readonly NAME = "WebsiteError";

  public static readonly not_found = Yexception.field<{ ref: string }>();
  public static readonly already_exists = Yexception.field<{ hostname: string }>();

  static {
    Yexception.initialize(this);
  }
}
