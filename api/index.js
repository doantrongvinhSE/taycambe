const serverless = require("serverless-http");
const app = require("../index"); // nếu bạn tách app logic ra file riêng

module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};