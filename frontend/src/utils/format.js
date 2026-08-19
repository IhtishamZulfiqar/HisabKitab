export function formatPKR(amount) {
  const n = Number(amount ?? 0);
  const formatted = Math.abs(n).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${n < 0 ? "-" : ""}Rs. ${formatted}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function monthLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
}

export function currentMonthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function categoriesForSelect(categories) {
  const options = [];
  categories
    .filter((c) => !c.parent)
    .forEach((parent) => {
      options.push({ id: parent.id, label: parent.name });
      categories
        .filter((c) => c.parent === parent.id)
        .forEach((child) => options.push({ id: child.id, label: `— ${child.name}` }));
    });
  return options;
}
