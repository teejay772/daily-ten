// Several requests can overlap, for example two taps on two topics before the first day
// file has arrived. Only the newest one may take effect.
//
//   const begin = latestOnly();
//   const stillWanted = begin();   // when a request starts
//   ...await something...
//   if (!stillWanted()) return;    // a newer request has started since
export function latestOnly() {
  let newest = 0;
  return () => {
    const mine = ++newest;
    return () => mine === newest;
  };
}
