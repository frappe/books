import { Fyo, t } from 'fyo';

export const dbErrorActionSymbols = {
  SelectFile: Symbol('select-file'),
  CancelSelection: Symbol('cancel-selection'),
} as const;

const dbErrors = {
  DirectoryDoesNotExist: 'directory does not exist',
} as const;

type Conn = {
  countryCode: string;
  error?: Error;
  actionSymbol?: typeof dbErrorActionSymbols[keyof typeof dbErrorActionSymbols];
};

export async function connectToDatabase(
  fyo: Fyo,
  dbPath: string,
  countryCode?: string
): Promise<Conn> {
  try {
    return { countryCode: await fyo.db.connectToDatabase(dbPath, countryCode) };
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    const actionSymbol = await handleDatabaseConnectionError(error, dbPath);

    return { countryCode: '', error, actionSymbol };
  }
}

async function handleDatabaseConnectionError(error: Error, dbPath: string) {
  if (error.message?.includes(dbErrors.DirectoryDoesNotExist)) {
    return await handleDirectoryDoesNotExist(dbPath);
  }

  throw error;
}

async function handleDirectoryDoesNotExist(dbPath: string) {
  const { showDialog } = await import('src/utils/interactive');
  return await showDialog({
    type: 'error',
    title: t`Cannot Open File`,
    detail: t`Directory for file ${dbPath} does not exist`,
    buttons: [
      {
        label: t`Select File`,
        action() {
          return dbErrorActionSymbols.SelectFile;
        },
        isPrimary: true,
      },
      {
        label: t`Cancel`,
        action() {
          return dbErrorActionSymbols.CancelSelection;
        },
        isEscape: true,
      },
    ],
  });
}
