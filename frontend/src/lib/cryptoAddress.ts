export function generateCryptoAddress(currency: string, seed: string): string {
  const hex = async (s: string) => {
    const buf = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const hexSync = (s: string): string => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const chr = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    const seed = Math.abs(hash).toString(16).padStart(8, '0');
    return seed + seed + seed + seed + seed + seed + seed + seed;
  };

  const h = hexSync(seed);
  switch (currency) {
    case 'BTC': return 'bc1' + h.slice(0, 38);
    case 'ETH': return '0x' + h.slice(0, 40);
    case 'USDT': return '0x' + h.slice(0, 40);
    default: return seed;
  }
}

export function shortenAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}
