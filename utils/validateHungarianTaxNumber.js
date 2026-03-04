function validateHungarianTaxNumber(taxNumber) {
  const regex = /^(\d{8})-(\d)-(\d{2})$/;
  const match = taxNumber.match(regex);

  if (!match) return false;

  const digits = match[1].split("").map(Number);
  const checkDigit = digits[7];

  const weights = [9, 7, 3, 1, 9, 7, 3];
  let sum = 0;

  for (let i = 0; i < 7; i++) {
    sum += digits[i] * weights[i];
  }

  const calculated = (10 - (sum % 10)) % 10;

  return calculated === checkDigit;
}

module.exports = validateHungarianTaxNumber;
