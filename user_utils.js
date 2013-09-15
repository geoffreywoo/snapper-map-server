module.exports = {
  normalizePhone: function(phone) {
    if (!phone) {
      return phone;
    }
    normalized = phone.replace(/\D/g, '');
    if (normalized.length == 11 && normalized[0] == '1') {
      return normalized.substr(1);
    } else {
      return normalized;
    }
  }
};