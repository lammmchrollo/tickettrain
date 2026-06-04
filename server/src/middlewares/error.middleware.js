module.exports = (err, req, res, next) => {
  console.error('Server error:', err.message);
  if (err.meta) {
    console.error('Server error meta:', err.meta);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd
    ? 'Da xay ra loi. Vui long thu lai sau.'
    : (err.message || 'Loi he thong');

  return res.status(err.status || 500).json({
    success: false,
    message
  });
};
