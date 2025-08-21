// constants/access.ts
export type Role = string;

/**
 * Regras por rota (ajuste conforme seu app)
 * Observação: comparação de cargos é case-insensitive.
 */
export const ROUTE_RULES: Record<string, "PUBLIC" | "AUTH" | Role[]> = {
  "/login": "PUBLIC",

  // qualquer logado
  "/home": "AUTH",
  "/AtestadoScreen": "AUTH",
  "/comunicadosGerais": "AUTH",

  // restritas por cargo
  // Marketing
  "/copy-hub": [
    "ADMIN",
    "MARKETING",
    "LIDERMARKETING",     // novo cargo de liderança de marketing
  ],

  // Compras / Logística / Operações
  "/ListaDeComprasScreen": [
    "ADMIN"   // novo
  ],



  // RH / Atestados / Resultados
  "/ver-atestados": [
    "RH",
    "ADMIN",
    "LIDERRH",            // novo
  ],
  "/resultados-formularios": [
    "ADMIN",
    "QUALIDADE",          // novo
  ],

  // Comunicados (líderes e áreas amplas)
  "/comunicados": [
    "ADMIN",
    "RH",
    // "LIDERRH",
    // "LIDERMARKETING",
    // "LIDERCOMERCIAL",     // novo
    // "LIDERQUALIDADE",     // novo
    // "LIDERLOGISTICA",     // novo
    // "LIDERFINANCIERO",    // novo (grafia pedida)
    // "LIDERFINANCEIRO",    // opcional: variação PT-BR
    // "LIDEROPERACIONAL",   // novo

    // // cargos de área
    // "QUALIDADE",          // novo
    // "FINANCEIRO",         // novo
    // "COMERCIAL",          // novo
    // "MARKETING",
    // "LOGISTICA",
    // "COMPRAS",
  ],
};

// --- helpers ---
function normalizePath(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return path.replace(/\/+$/, "");
}

function matchRule(
  pathname: string
): [string, "PUBLIC" | "AUTH" | Role[]] | null {
  const p = normalizePath(pathname);
  let best = "";
  for (const key of Object.keys(ROUTE_RULES)) {
    if (p === key || p.startsWith(key + "/")) {
      if (key.length > best.length) best = key;
    }
  }
  if (!best) return null;
  return [best, ROUTE_RULES[best]];
}

type SimpleUser = { role?: string } | null;

export function canAccess(user: SimpleUser, pathname: string): boolean {
  const m = matchRule(pathname);
  if (!m) return !!user; // sem regra explícita -> exige login

  const rule = m[1];
  if (rule === "PUBLIC") return true;
  if (rule === "AUTH") return !!user;

  // regra com cargos
  if (!user?.role) return false;

  // case-insensitive e tolerante a espaços
  const userRole = (user.role || "").trim().toUpperCase();
  const allowed = rule.map((r) => (r || "").toUpperCase().trim());

  return allowed.includes(userRole);
}
