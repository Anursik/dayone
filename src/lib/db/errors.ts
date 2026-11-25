import { ZodError } from "zod";

/** Ошибка слоя данных с понятным пользователю сообщением. */
export class DataError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly cause?: unknown,
  ) {
    super(userMessage);
    this.name = "DataError";
  }
}

function errorName(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { name?: string; inner?: { name?: string } };
    return e.inner?.name || e.name || "";
  }
  return "";
}

/** Переводит ошибки IndexedDB / Dexie / Zod в сообщения на русском. */
export function toDataError(error: unknown): DataError {
  if (error instanceof DataError) return error;
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const where = issue?.path.length ? ` (поле «${issue.path.join(".")}»)` : "";
    return new DataError(`Некорректные данные${where}: ${issue?.message ?? "ошибка проверки"}`, error);
  }

  switch (errorName(error)) {
    case "QuotaExceededError":
      return new DataError("На устройстве закончилось место для данных. Освободите память и повторите.", error);
    case "VersionError":
      return new DataError(
        "Данные созданы более новой версией DAYONE. Перезапустите приложение, чтобы загрузить обновление.",
        error,
      );
    case "InvalidStateError":
    case "MissingAPIError":
      return new DataError(
        "Хранилище браузера недоступно (возможно, включён приватный режим). Без него данные не сохранятся.",
        error,
      );
    case "DatabaseClosedError":
      return new DataError("Соединение с хранилищем закрыто. Перезапустите приложение.", error);
    case "ConstraintError":
      return new DataError("Такая запись уже существует.", error);
    case "AbortError":
      return new DataError("Операция с данными была прервана. Повторите попытку.", error);
    default:
      return new DataError("Не удалось сохранить данные. Повторите попытку.", error);
  }
}

/** Выполняет операцию с хранилищем, преобразуя ошибки в DataError. */
export async function withDataErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toDataError(error);
  }
}
