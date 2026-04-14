import { SQLiteError } from "bun:sqlite";

enum Reason {
  primary_key_violation = "primary_key_violation",
  unique_violation = "unique_violation",
}

export class PersistenceError extends Error {
  public static readonly Reason = Reason;

  public static cast(error: unknown) {
    if (error instanceof SQLiteError) {
      switch (error.code) {
        case "SQLITE_CONSTRAINT_PRIMARYKEY":
          return new PersistenceError(Reason.primary_key_violation);
        case "SQLITE_CONSTRAINT_UNIQUE":
          return new PersistenceError(Reason.unique_violation);
      }
    }
    return error;
  }

  private constructor(public readonly reason: Reason) {
    super(reason);
  }

  public static is(error: unknown, reason: Reason): error is PersistenceError {
    return error instanceof PersistenceError && error.reason === reason;
  }
}
