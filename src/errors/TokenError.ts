import { Yexception } from "yexception";

export class TokenError {
  public static readonly NAME = "TokenError";

  public static readonly not_found = Yexception.field<{ id: string }>();
  public static readonly websites_not_found = Yexception.field<{ ids: string[] }>();

  static {
    Yexception.initialize(this);
  }
}
