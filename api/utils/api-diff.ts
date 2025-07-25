export function diffOpenApi(
  oldSpec: any,
  newSpec: any,
): { summary: string; changed: boolean } {
  if (!oldSpec || !newSpec)
    return { summary: 'Missing spec(s)', changed: false };

  // Quick version diff
  const oldVer = oldSpec.info?.version || 'unknown';
  const newVer = newSpec.info?.version || 'unknown';

  if (oldVer !== newVer) {
    return {
      summary: `Version changed from ${oldVer} to ${newVer}`,
      changed: true,
    };
  }

  // Quick path diff (count number of endpoints)
  const oldPaths = Object.keys(oldSpec.paths || {});
  const newPaths = Object.keys(newSpec.paths || {});
  if (oldPaths.length !== newPaths.length) {
    return {
      summary: `Path count changed from ${oldPaths.length} to ${newPaths.length}`,
      changed: true,
    };
  }

  // Otherwise, no change detected
  return { summary: 'No significant change', changed: false };
}
