import { SQLiteError } from "bun:sqlite";

type Reason = "primary_key_violation" | "unique_violation";

export class PersistenceError extends Error {
  public static cast(error: unknown) {
    if (error instanceof SQLiteError) {
      switch (error.code) {
        case "SQLITE_CONSTRAINT_PRIMARYKEY":
          return new PersistenceError("primary_key_violation");
        case "SQLITE_CONSTRAINT_UNIQUE":
          return new PersistenceError("unique_violation");
      }
    }
    return error;
  }

  private constructor(public readonly reason: Reason) {
    super();
  }

  public static is(error: unknown, reason: Reason): error is PersistenceError {
    return error instanceof PersistenceError && error.reason === reason;
  }
}
