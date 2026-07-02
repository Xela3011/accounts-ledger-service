export function formatMoney(amount: string, currency: string) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${currency} ${amount}`;
  }

  return `${currency} ${numericAmount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

export function formatAccountStatus(status: string) {
  switch (status) {
    case 'ACTIVE':
    case 'Active':
      return 'Activa';
    case 'CLOSED':
    case 'Closed':
      return 'Cerrada';
    case 'FROZEN':
    case 'Frozen':
      return 'Congelada';
    default:
      return status;
  }
}
