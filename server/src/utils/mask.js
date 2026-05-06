function maskPhone(phone = '') {
  if (phone.length < 6) return '******';
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

function maskNationalId(id = '') {
  if (id.length < 4) return '****';
  return `${'*'.repeat(Math.max(id.length - 4, 4))}${id.slice(-4)}`;
}

module.exports = { maskPhone, maskNationalId };
