function checkEnv(vars: string[], message?: string) {
  for (const v of vars) {
    let value = import.meta.env[v];
    if (value !== undefined && value !== '') {
      if (message !== undefined)
        console.log(`Found environment variable ${v} (='${value}'). ${message}`);
      return true;
    }
  }
  return false;
}

export const DEV_MODE = checkEnv(
  ['DEV', 'DEV_MODE', 'DEVELOPMENT', 'DEVELOPMENT_MODE'],
  'Enabling development mode.',
);
export const DEBUG_MODE = checkEnv(['DEBUG', 'DEBUG_MODE'], 'Enabling debug mode.');
