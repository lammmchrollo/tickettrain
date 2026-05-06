module.exports = (err, req, res, next) => {
  console.error('Server error:', err.message);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Loi he thong'
  });
};
